class Algorithm < ApplicationRecord
  belongs_to :user

  validates :name, presence: true
  validates :diagram, presence: true

  default_scope { order(created_at: :desc) }
end
