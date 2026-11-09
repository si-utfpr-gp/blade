class BuilderController < ApplicationController
  # The builder is open: signing in stores work, it does not gate drawing. The
  # algorithms API is the part that needs an account, and it keeps its own guard.
  def index
    # Both reach the React side through the root element: the name fills the
    # account menu, the flag tells the builder whether to show the features
    # that only make sense with an account.
    @user_name = current_user&.name
    @signed_in = current_user.present?
  end
end
