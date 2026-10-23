# The public, read-only views of a shared algorithm, open to anyone with the
# link and no account. They show the diagram and nothing about its owner.
#
# /s/:token is a page of its own; /embed/:token is the same viewer trimmed
# for an iframe, and the only page other sites may frame.
class SharedAlgorithmsController < ApplicationController
  # Links end up in public pages, so readers come in numbers; this only stops
  # someone hammering the server from one address. A class opening the link
  # its teacher sent shares the campus address, so there is room for 200
  # students opening it and reloading.
  rate_limit to: 600, within: 1.minute, store: RATE_LIMIT_STORE,
             with: -> { head :too_many_requests }

  before_action :set_algorithm

  # Other sites may put the embed in an iframe; everything else keeps Rails'
  # SAMEORIGIN, so the builder itself cannot be framed for clickjacking.
  content_security_policy only: :embed do |policy|
    policy.frame_ancestors "*"
  end
  after_action :allow_framing, only: :embed

  def show
    @mode = "shared"
    render :show
  end

  def embed
    @mode = "embed"
    render :show
  end

  private

  def set_algorithm
    @algorithm = Algorithm.find_shared(params[:token])
    render "errors/not_found", status: :not_found, formats: :html unless @algorithm
  end

  def allow_framing
    response.headers.delete("X-Frame-Options")
  end
end
