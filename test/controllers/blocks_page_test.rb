require "test_helper"

# The blocks page at /blocks is the reference for the flowchart blocks: what
# each one does, how to fill it in and an example, in the order the builder
# lists them.
class BlocksPageTest < ActionController::TestCase
  tests BlocksController

  setup do
    @controller.define_singleton_method(:current_user) { nil }
  end

  test "is served at /blocks" do
    assert_routing "/blocks", controller: "blocks", action: "show"
  end

  test "documents every block of the builder" do
    get :show

    assert_response :success
    assert_select "h1", /blocos/i
    %w[inicio fim memoria entrada processo saida decisao escolha conector sub-rotina].each do |anchor|
      assert_select "article[data-block][id=?]", anchor
    end
  end

  test "each block says what it does and shows an example" do
    get :show

    assert_select "article[data-block]" do |articles|
      articles.each do |article|
        assert_select article, "h2", 1
        assert_select article, "[data-example]", minimum: 1
      end
    end
  end

  test "an index links to each block" do
    get :show

    assert_select "nav a[href=?]", "#decisao"
    assert_select "nav a[href=?]", "#escolha"
  end

  test "lists the operators the expressions accept" do
    get :show

    assert_select "#expressoes code", /ou/
    assert_select "#expressoes code", /nao/
  end

  test "is linked from the landing navigation and the footer" do
    @controller = LandingController.new
    @controller.define_singleton_method(:current_user) { nil }

    get :show

    assert_select "header a[href=?]", "/blocks"
    assert_select "footer a[href=?]", "/blocks"
  end
end
