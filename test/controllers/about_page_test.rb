require "test_helper"

# The about page at /about credits the team: what Blade is, where it comes from
# (the Sistemas de Informação course at UTFPR Guarapuava), who builds it and how
# to reach the people responsible.
class AboutPageTest < ActionController::TestCase
  tests AboutController

  setup do
    @controller.define_singleton_method(:current_user) { nil }
  end

  test "is served at /about" do
    assert_routing "/about", controller: "about", action: "show"
  end

  test "describes the project and where it comes from" do
    get :show

    assert_response :success
    assert_select "h1", /sobre/i
    assert_select "body", /Sistemas de Informação/
    assert_select "body", /UTFPR/
    assert_select "body", /Guarapuava/
  end

  test "credits the developers with their GitHub profiles" do
    get :show

    assert_select "a[href=?]", "https://github.com/lucasgfaj", /Lucas Gontarz Fajardo/
    assert_select "a[href=?]", "https://github.com/emanuel-o-dev", /Emanuel Oliveira Andrade/
  end

  test "credits the project advisors" do
    get :show

    assert_select "body", /Pensamento Computacional e Linguagem de Programação Visual/
    assert_select "body", /Prof\. Dr\. Diego Marczal/
    assert_select "body", /Profª\. Drª\. Renata Luiza Stange/
  end

  test "points to the repository and its contributors" do
    get :show

    assert_select "a[href=?]", "https://github.com/si-utfpr-gp/blade"
    assert_select "a[href=?]", "https://github.com/si-utfpr-gp/blade/graphs/contributors"
  end

  test "gives a contact email" do
    get :show

    assert_select "a[href=?]", "mailto:marczal@utfpr.edu.br"
  end

  test "has the same mobile menu as the other public pages" do
    get :show

    assert_select "details[data-mobile-menu] a[href=?]", "/"
    assert_select "details[data-mobile-menu] a[href=?]", "/builder"
  end
end
