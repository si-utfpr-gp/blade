class Algorithm < ApplicationRecord
  belongs_to :user

  # Named rather than a default_scope: a default order leaked into every query
  # and made group and count fail on Postgres, since created_at was not part of
  # the GROUP BY.
  scope :newest_first, -> { order(created_at: :desc) }

  validates :name, presence: true
  # One algorithm per name per student. Two records differing only in case would
  # be indistinguishable in the dropdown, and the student would not understand
  # which one is missing. The database index on lower(name) is the backstop for
  # concurrent saves, which validation alone cannot cover.
  validates :name, uniqueness: {
    scope: :user_id,
    case_sensitive: false,
    message: "já existe um algoritmo com esse nome"
  }
  validates :diagram, presence: true

  # Stripping before validation keeps "  Contador  " from sneaking past the
  # uniqueness check, and stops stray spaces showing up in the dropdown.
  normalizes :name, with: ->(name) { name.strip }

  # The public link. Off until the owner turns it on; turning it off clears the
  # token, so a link once revoked never works again, even if shared again.
  def shared?
    share_token.present?
  end

  # Sharing an already shared algorithm keeps its link: pages that embed it
  # must not break because the owner pressed the button twice.
  def share!
    return if shared?

    update!(share_token: SecureRandom.urlsafe_base64(24), shared_at: Time.current)
  end

  def unshare!
    update!(share_token: nil, shared_at: nil)
  end

  def self.find_shared(token)
    return nil if token.blank?

    find_by(share_token: token.to_s)
  end
end
