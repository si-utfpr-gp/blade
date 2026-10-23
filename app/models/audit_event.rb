# The audit trail: sign ins, sign outs, new accounts and the changes that
# cannot be undone (deleting, sharing). Saves are not recorded; there are
# thousands of them a class and they say nothing an audit needs.
class AuditEvent < ApplicationRecord
  ACTIONS = %w[
    account.created session.signed_in session.signed_out
    algorithm.created algorithm.destroyed algorithm.shared algorithm.unshared
  ].freeze

  belongs_to :user, optional: true
  belongs_to :subject, polymorphic: true, optional: true

  validates :action, inclusion: { in: ACTIONS }

  def self.record(action, user:, request:, subject: nil, details: {})
    create!(action: action, user: user, subject: subject, details: details,
            ip_address: request.remote_ip)
  end
end
