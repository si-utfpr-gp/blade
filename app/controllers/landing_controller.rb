# The public landing page at /. It presents Blade and points to the login page
# or straight into the builder; signed in, it offers to continue instead.
class LandingController < ApplicationController
  def show
    @user = current_user
  end
end
