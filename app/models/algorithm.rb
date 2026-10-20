class Algorithm < ApplicationRecord
  belongs_to :user

  # Named rather than a default_scope: a default order leaked into every query
  # and made group and count fail on Postgres, since created_at was not part of
  # the GROUP BY.
  scope :newest_first, -> { order(created_at: :desc) }

  # The same limit the builder puts on the name field, so a request made
  # outside the builder cannot store a name the dropdown would not fit.
  # The messages are whole sentences: the API sends them to the builder as
  # they are, without the English attribute name in front.
  NAME_MAX_LENGTH = 50
  # Far beyond any classroom exercise, yet small enough that a script cannot
  # turn a student's account into storage.
  DIAGRAM_MAX_NODES = 300
  DIAGRAM_MAX_BYTES = 256.kilobytes
  MAX_PER_USER = 100

  validates :name, presence: true
  validates :name, length: {
    maximum: NAME_MAX_LENGTH,
    message: "O nome pode ter no máximo %{count} caracteres"
  }
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
  validate :diagram_within_limits
  validate :user_within_algorithm_limit, on: :create

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

  private

  def diagram_within_limits
    return unless diagram.is_a?(Hash)

    nodes = diagram["nodes"]
    if nodes.is_a?(Array) && nodes.size > DIAGRAM_MAX_NODES
      errors.add(:diagram, "O diagrama pode ter no máximo #{DIAGRAM_MAX_NODES} blocos")
    elsif diagram.to_json.bytesize > DIAGRAM_MAX_BYTES
      errors.add(:diagram, "O diagrama é grande demais para ser salvo")
    end
  end

  # Only on create: a student at the limit must still be able to edit and save
  # what they already have.
  def user_within_algorithm_limit
    return unless user
    return if user.algorithms.count < MAX_PER_USER

    errors.add(:base, "Você já tem #{MAX_PER_USER} algoritmos salvos; apague algum para salvar outro")
  end
end
