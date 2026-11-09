require "omniauth"
require "omniauth/rails_csrf_protection"

# OmniAuth 2.0 blocks GET on /auth/:provider, which is the mitigation for
# CVE-2015-9284. Stating it explicitly keeps a login link from failing quietly.
OmniAuth.config.allowed_request_methods = [ :post ]
OmniAuth.config.logger = Rails.logger
OmniAuth.config.path_prefix = "/auth"

# The environment wins, so .env keeps working in development and a deploy can
# override a value without re-encrypting anything. When it is blank (Kamal
# passes unset secrets as empty strings) the encrypted Rails credentials are
# used instead, under google.client_id and google.client_secret.
google_setting = lambda do |env_key, credentials_key|
  ENV[env_key].presence || Rails.application.credentials.dig(:google, credentials_key)
end

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2,
           google_setting.call("GOOGLE_CLIENT_ID", :client_id),
           google_setting.call("GOOGLE_CLIENT_SECRET", :client_secret),
           scope: "email profile",
           prompt: "select_account",
           name: "google_oauth2"
end
