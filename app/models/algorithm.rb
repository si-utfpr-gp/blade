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
end
