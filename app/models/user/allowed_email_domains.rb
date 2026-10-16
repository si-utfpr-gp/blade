class User
  # The university's real domains are not known yet: the Workspace admin console,
  # an LDAP query or the IT department have to confirm them. Until then the list
  # stays empty and any Google account is accepted, which keeps testing possible.
  # Turning the list on is a configuration change, not a code change.
  module AllowedEmailDomains
    ENV_KEY = "GOOGLE_ALLOWED_DOMAINS".freeze

    @cache = nil

    class << self
      def allowed
        configured
      end

      # Empty or unset means no restriction, so a fresh checkout works before
      # anyone knows the domains.
      def configured
        @cache ||= ENV[ENV_KEY].to_s
          .split(",")
          .map { |domain| domain.strip.downcase }
          .reject(&:empty?)
          .uniq
          .freeze
      end

      def allowed?(email)
        domains = configured
        return true if domains.empty?

        domain = email.to_s.split("@").last.to_s.downcase
        return false if domain.empty?

        domains.include?(domain)
      end

      # Names come from config and change between runs in the test suite.
      def clear_cache!
        @cache = nil
      end
    end
  end
end
