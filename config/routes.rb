Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # The landing page presents Blade. /login lets the visitor pick between
  # signing in as a student (Google) or opening the builder as a guest. The
  # builder lives at /builder and is open without an account; signing in is
  # what saves work.
  root "landing#show"
  get "/login", to: "sessions#new", as: :login
  get "/builder", to: "builder#index", as: :builder_index
  # The OmniAuth request phase has to be a POST with a CSRF token; OmniAuth 2
  # rejects GET on /auth/:provider (CVE-2015-9284).
  #
  # The callback route is declared here because the middleware hands the request
  # back to the application once it has the credentials, and Rails needs a route
  # to turn that into a controller action.
  get "/auth/:provider/callback", to: "sessions#create", as: :auth_callback
  # POST works without JavaScript, which is what the header form relies on.
  # DELETE is accepted too, for callers that can set the method.
  match "/logout", to: "sessions#destroy", via: [ :post, :delete ], as: :logout

  resources :algorithms, only: [ :index, :create, :show, :update, :destroy ]
end
