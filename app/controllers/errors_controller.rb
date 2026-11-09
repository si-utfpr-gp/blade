# Answers every path the app does not serve, whatever the method: the catch-all
# route at the end of config/routes.rb sends them here. Unknown paths never
# reach another controller, and nothing about the app's insides is echoed back.
class ErrorsController < ApplicationController
  # Any method reaches this action, and there is nothing to protect in a 404.
  skip_forgery_protection

  def not_found
    # HTML comes first: a client accepting anything (a crawler, curl) gets
    # the page, and only an explicit JSON request gets JSON.
    respond_to do |format|
      format.html { render :not_found, status: :not_found }
      format.json { render json: { error: "não encontrado" }, status: :not_found }
      format.any { render :not_found, status: :not_found, formats: :html, content_type: "text/html" }
    end
  end
end
