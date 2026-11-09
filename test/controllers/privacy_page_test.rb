require "test_helper"

# The privacy page at /privacy states what is collected and for how long,
# with the periods ForgetOldAccessDataJob applies.
class PrivacyPageTest < ActionController::TestCase
  tests PrivacyController

  setup do
    @controller.define_singleton_method(:current_user) { nil }
  end

  test "is served at /privacy" do
    assert_routing "/privacy", controller: "privacy", action: "show"
  end

  test "states the retention periods the cleanup job applies" do
    get :show

    assert_response :success
    assert_select "h1", /privacidade/i
    assert_select "dl", /180 dias/
    assert_select "dl", /30 dias/
    assert_select "dl", /1 ano/
    assert_select "body", /LGPD/
  end

  test "keeps accounts and says how to ask for deletion" do
    get :show

    assert_select "dl", /Não apagamos contas paradas/
    assert_select "a[href=?]", "mailto:marczal@utfpr.edu.br"
  end
end
