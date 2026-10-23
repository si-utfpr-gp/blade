# How long Blade keeps what it records about access. The privacy page reads
# these, so what it promises and what ForgetOldAccessDataJob does stay the
# same numbers.
#
# Accounts and algorithms are not on this list: they stay until the student
# asks for them to be deleted, so a student who comes back years later still
# finds their work.
module DataRetention
  # A session unused this long is over; the student signs in again.
  SESSION_IDLE = 30.days
  # IP addresses and browser names are erased after this. Six months is what
  # the Marco Civil da Internet (Lei 12.965/2014, art. 15) asks of access logs.
  IP_ADDRESS = 180.days
  # Audit events, already without their IP, are deleted after this.
  AUDIT_EVENT = 1.year
end
