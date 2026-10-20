class AlgorithmsController < ApplicationController
  before_action :authenticate_user!

  # A student saves a handful of times a minute; a script flooding the
  # database with algorithms is stopped well before it matters. Counted per
  # student, so classmates behind the same campus IP do not share a limit.
  rate_limit to: 30, within: 1.minute, only: %i[create update destroy], name: "writes",
             by: -> { current_user&.id || request.remote_ip }, store: RATE_LIMIT_STORE,
             with: -> { render json: { error: TOO_MANY_REQUESTS }, status: :too_many_requests }
  rate_limit to: 120, within: 1.minute, only: %i[index show], name: "reads",
             by: -> { current_user&.id || request.remote_ip }, store: RATE_LIMIT_STORE,
             with: -> { render json: { error: TOO_MANY_REQUESTS }, status: :too_many_requests }

  def index
    render json: current_user.algorithms.newest_first
  end

  def show
    algorithm = owned_algorithm
    return head :not_found unless algorithm

    render json: algorithm
  end

  def create
    algorithm = current_user.algorithms.build(
      name: params[:name],
      diagram: diagram_param
    )

    if algorithm.save
      render json: algorithm, status: :created
    else
      render json: { errors: error_messages(algorithm) }, status: :unprocessable_entity
    end
  end

  def update
    algorithm = owned_algorithm
    return head :not_found unless algorithm

    algorithm.assign_attributes(
      name: params[:name],
      diagram: diagram_param
    )

    if algorithm.save
      render json: algorithm
    else
      render json: { errors: error_messages(algorithm) }, status: :unprocessable_entity
    end
  end

  def destroy
    algorithm = owned_algorithm
    return head :not_found unless algorithm

    algorithm.destroy!
    head :no_content
  end

  private

  # Only the messages: full_messages would put "Name" or "Diagram" in front of
  # sentences the builder shows in Portuguese.
  def error_messages(algorithm)
    algorithm.errors.map { |error| error.message.upcase_first }
  end

  # Scoping the lookup by the current user means another user's algorithm is
  # simply not found, instead of being exposed or raising.
  def owned_algorithm
    current_user&.algorithms&.find_by(id: params[:id])
  end

  def diagram_param
    raw = params[:diagram]
    raw = raw.to_unsafe_h if raw.respond_to?(:to_unsafe_h)
    parsed = raw.is_a?(String) ? JSON.parse(raw) : raw

    parsed.presence || { "nodes" => [], "edges" => [] }
  rescue JSON::ParserError
    { "nodes" => [], "edges" => [] }
  end
end
