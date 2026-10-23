require "test_helper"

# What search engines are told: robots.txt keeps them off the API and the
# sign in flow, the sitemap lists the public pages, and every page names
# myblade.dev as its canonical address, so www does not count as a copy.
class CrawlingTest < ActionDispatch::IntegrationTest
  test "robots.txt keeps crawlers off the API and points to the sitemap" do
    get "/robots.txt"

    assert_response :success
    assert_includes response.body, "Disallow: /algorithms"
    assert_includes response.body, "Disallow: /auth/"
    assert_includes response.body, "Sitemap: https://myblade.dev/sitemap.xml"
  end

  # Blocking /s/ would hide the noindex tag from crawlers.
  test "robots.txt leaves shared algorithms crawlable" do
    get "/robots.txt"

    assert_no_match %r{Disallow: /(s|embed)/}, response.body
  end

  test "the sitemap lists only routes that exist" do
    get "/sitemap.xml"
    paths = response.body.scan(%r{<loc>https://myblade\.dev(/[^<]*)</loc>}).flatten

    assert_includes paths, "/privacy"
    paths.each do |path|
      get path
      assert_response :success, "#{path} is in the sitemap but does not answer 200"
    end
  end

  test "pages name myblade.dev as canonical" do
    get "/about?ref=x"

    assert_select "link[rel=canonical][href=?]", "https://myblade.dev/about"
  end
end
