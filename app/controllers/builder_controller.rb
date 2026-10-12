class BuilderController < ApplicationController
  def index
    # The user name reaches the header account menu through the root element.
    @user_name = current_user&.name
  end
end
