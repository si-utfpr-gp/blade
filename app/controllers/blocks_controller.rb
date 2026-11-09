# The blocks page at /blocks: the reference for each flowchart block, open to
# everyone like the landing and the about page.
class BlocksController < ApplicationController
  def show
    @user = current_user
  end
end
