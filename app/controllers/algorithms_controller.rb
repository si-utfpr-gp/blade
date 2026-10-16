class AlgorithmsController < ApplicationController
  before_action :authenticate_user!

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
      render json: { errors: algorithm.errors.full_messages }, status: :unprocessable_entity
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
      render json: { errors: algorithm.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    algorithm = owned_algorithm
    return head :not_found unless algorithm

    algorithm.destroy!
    head :no_content
  end

  private

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
