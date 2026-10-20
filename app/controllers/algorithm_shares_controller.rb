# Turns an algorithm's public link on and off. Only its owner can: another
# student's algorithm is simply not found, as in AlgorithmsController.
class AlgorithmSharesController < ApplicationController
  before_action :authenticate_user!

  rate_limit to: 30, within: 1.minute, name: "shares",
             by: -> { current_user&.id || request.remote_ip }, store: RATE_LIMIT_STORE,
             with: -> { render json: { error: TOO_MANY_REQUESTS }, status: :too_many_requests }

  def create
    algorithm = owned_algorithm
    return head :not_found unless algorithm

    algorithm.share!
    render json: {
      share_url: shared_algorithm_url(algorithm.share_token),
      embed_url: embedded_algorithm_url(algorithm.share_token)
    }
  end

  def destroy
    algorithm = owned_algorithm
    return head :not_found unless algorithm

    algorithm.unshare!
    head :no_content
  end

  private

  def owned_algorithm
    current_user&.algorithms&.find_by(id: params[:algorithm_id])
  end
end
