class User
  # Restricts sign in to the configured email domains and their subdomains:
  # listing utfpr.edu.br lets in @utfpr.edu.br and @alunos.utfpr.edu.br alike.
  # An empty list accepts any Google account, which keeps local testing
  # possible; turning the list on is a configuration change, not a code change.
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

        domains.any? { |allowed| domain == allowed || domain.end_with?(".#{allowed}") }
      end

      # Names come from config and change between runs in the test suite.
      def clear_cache!
        @cache = nil
      end
    end
  end
end
