class User < ApplicationRecord
  DEV_LOGIN = "dev".freeze
  DEV_NAME = "Aluno de Teste".freeze

  GOOGLE_PROVIDER = "google_oauth2".freeze

  # Raised instead of creating a user, so the login screen can explain what
  # happened rather than showing a generic failure.
  class EmailRequired < StandardError; end
  class EmailNotVerified < StandardError; end

  has_many :algorithms, dependent: :destroy

  validates :login, presence: true, uniqueness: true
  validates :name, presence: true
  validates :provider_uid, uniqueness: { scope: :provider }, allow_nil: true

  # Populates a user from an LDAP entry. Kept attribute-name agnostic so the
  # mapper can be adjusted when the university's LDAP schema is known.
  def self.from_ldap(entry)
    new(
      login: entry.uid.to_s,
      name: entry.cn.to_s,
      ldap_uid: entry.uid.to_s,
      ldap_email: entry.mail&.to_s
    )
  end

  # Finds or creates a user from an OmniAuth Google hash.
  #
  # The lookup is by provider + provider_uid, never by email: Google lets
  # people change their address, and matching on email would orphan their
  # algorithms on the next sign in.
  def self.from_google(auth)
    info = auth["info"] || {}
    email = info["email"].presence
    raise EmailRequired, "A conta do Google não информа um email." if email.nil?

    unless google_email_verified?(auth)
      raise EmailNotVerified, "O email da conta do Google não está verificado."
    end

    uid = auth["uid"].to_s

    user = find_by(provider: GOOGLE_PROVIDER, provider_uid: uid)

    if user
      # Refresh the mutable fields so a rename or new avatar shows up.
      user.update!(login: email, name: info["name"].presence || user.name,
                   avatar_url: info["image"].presence)
      user
    else
      create!(
        provider: GOOGLE_PROVIDER,
        provider_uid: uid,
        login: email,
        name: info["name"].presence || email.split("@").first,
        avatar_url: info["image"].presence
      )
    end
  end

  # Google reports this claim; a Gmail address without it cannot be trusted as
  # institutional.
  def self.google_email_verified?(auth)
    raw = auth.dig("extra", "raw_info", "email_verified")
    raw = auth.dig("info", "email_verified") if raw.nil?
    raw.present? ? to_boolean(raw) : false
  end

  def self.to_boolean(value)
    ActiveModel::Type::Boolean.new.cast(value) ? true : false
  end
  private_class_method :to_boolean

  # Development and test fallback so the builder is usable without Google.
  # Returns nil in production, where a real sign in is required.
  def self.dev_user
    return nil unless Rails.env.development? || Rails.env.test?

    find_or_create_by!(login: DEV_LOGIN) do |user|
      user.name = DEV_NAME
    end
  end
end
