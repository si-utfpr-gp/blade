require "omniauth"
require "omniauth/rails_csrf_protection"

# OmniAuth 2.0 blocks GET on /auth/:provider, which is the mitigation for
# CVE-2015-9284. Stating it explicitly keeps a login link from failing quietly.
OmniAuth.config.allowed_request_methods = [ :post ]
OmniAuth.config.logger = Rails.logger
OmniAuth.config.path_prefix = "/auth"

# The credentials live in the environment: .env during development and the
# Rails credentials on the VPS. Nothing secret is committed.
Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2,
           ENV["GOOGLE_CLIENT_ID"],
           ENV["GOOGLE_CLIENT_SECRET"],
           scope: "email profile",
           prompt: "select_account",
           name: "google_oauth2"
end
