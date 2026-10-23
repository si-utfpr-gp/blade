# The privacy page at /privacy: what Blade collects, why, for how long and
# how a student exercises their rights under the LGPD. Retention periods come
# from DataRetention, the same constants the cleanup job uses.
class PrivacyController < ApplicationController
  def show
    @user = current_user
  end
end
