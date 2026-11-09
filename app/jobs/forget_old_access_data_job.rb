# Runs daily (config/recurring.yml) and applies DataRetention: idle sessions
# are deleted, IP addresses and browser names are erased, and old audit events
# go. Accounts and algorithms are left alone.
class ForgetOldAccessDataJob < ApplicationJob
  queue_as :default

  def perform
    Session.where(last_seen_at: ...DataRetention::SESSION_IDLE.ago).delete_all

    ip_cutoff = DataRetention::IP_ADDRESS.ago
    Session.where(created_at: ...ip_cutoff).update_all(ip_address: nil, user_agent: nil)
    AuditEvent.where(created_at: ...ip_cutoff).where.not(ip_address: nil).update_all(ip_address: nil)

    AuditEvent.where(created_at: ...DataRetention::AUDIT_EVENT.ago).delete_all
  end
end
