require "test_helper"

class OmniauthConfigurationTest < ActiveSupport::TestCase
  # OmniAuth 2.0 blocks GET on /auth/:provider (CVE-2015-9284). A login form
  # that still points at GET silently fails, so the setting is asserted rather
  # than assumed.
  test "GET is not an allowed request method for the request phase" do
    assert_equal [ :post ], OmniAuth.config.allowed_request_methods
  end

  test "GET requests are not silenced away, so misuse stays visible" do
    assert_not OmniAuth.config.silence_get_warning
  end

  test "the google_oauth2 strategy is registered" do
    strategies = Rails.application.config.middleware.middlewares.flat_map { |m|
      m.name.to_s
    }

    assert_includes strategies, "OmniAuth::Builder"
  end

  test "credentials come from the environment or Rails credentials, never hardcoded" do
    initializer = Rails.root.join("config/initializers/omniauth.rb").read

    assert_includes initializer, "\"GOOGLE_CLIENT_ID\""
    assert_includes initializer, "\"GOOGLE_CLIENT_SECRET\""
    assert_includes initializer, "credentials.dig(:google, credentials_key)"
  end

  test "no client secret is committed in the repository" do
    initializer = Rails.root.join("config/initializers/omniauth.rb").read

    # Guards against someone pasting real credentials instead of reading ENV.
    assert_no_match(/\b\d{10,}-[a-z0-9]{10,}\.apps\.googleusercontent\.com/, initializer)
  end
end
