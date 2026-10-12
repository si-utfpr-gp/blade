class User < ApplicationRecord
  DEV_LOGIN = "dev".freeze
  DEV_NAME = "Aluno de Teste".freeze

  has_many :algorithms, dependent: :destroy

  validates :login, presence: true, uniqueness: true
  validates :name, presence: true

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

  # Development and test fallback so the builder is usable without an LDAP
  # server. Returns nil in production, where real authentication is required.
  def self.dev_user
    return nil unless Rails.env.development? || Rails.env.test?

    find_or_create_by!(login: DEV_LOGIN) do |user|
      user.name = DEV_NAME
    end
  end
end
