# The about page at /about. It credits the team behind Blade and says where the
# project comes from; signed in or not, everyone sees the same page.
class AboutController < ApplicationController
  def show
    @user = current_user
  end
end
