import Config

# For development, we disable any cache and enable
# debugging and code reloading.
#
# The watchers configuration can be used to run external
# watchers to your application. For example, we can use it
# to bundle .js and .css sources.
#
port =
  case System.get_env("PORT") do
    nil -> 4001
    p -> String.to_integer(p)
  end

sentry_dsn_define =
  if (sentry_dsn = System.get_env("SENTRY_DSN", "")) == "" do
    "--define:SENTRY_DSN=false"
  else
    "--define:SENTRY_DSN='#{sentry_dsn}'"
  end

# Do not include metadata nor timestamps in development logs
config :logger, :console, format: "[$level] $message\n"

# Initialize plugs at runtime for faster development compilation
config :phoenix, :plug_init_mode, :runtime

# Set a higher stacktrace during development. Avoid configuring such
# in production as building large stacktraces may be expensive.
config :phoenix, :stacktrace_depth, 20

config :phoenix_live_view,
  # Include HEEx debug annotations as HTML comments in rendered markup
  debug_heex_annotations: true,
  # Enable helpful, but potentially expensive runtime checks
  enable_expensive_runtime_checks: true

config :ride_along, RideAlong.EtaCalculator.Model, start: true
config :ride_along, RideAlong.EtaMonitor, start: true
config :ride_along, RideAlong.LinkShortener, secret: "UHZ0Lf/EGdIYNHWwTKoowoRJt+HFsrP8iwKPp/2XthQYE2BhRhjtfGJDLU0b70HI"

config :ride_along, RideAlong.MqttConnection,
  start: true,
  broker_configs: ["mqtt://system:manager@localhost/"],
  broker_topic_prefix: "ride-along-local/"

config :ride_along, RideAlong.MqttListener, start: true
config :ride_along, RideAlong.RiderNotifier, start: true

config :ride_along, RideAlong.WebhookPublisher,
  start: true,
  secret: "BZaW7eynx3VJvqUD0k6jz7VD3PEAywZRPbpDds/UDsHZ5cDnvoUIwvLQkKcwhvnR",
  webhooks: %{
    "https://localhost:4001/webhook-test" => "secret"
  }

config :ride_along, RideAlongWeb.Api,
  api_keys: %{
    "api_key" => "Local Development"
  }

config :ride_along, RideAlongWeb.Endpoint,
  https: [
    ip: {127, 0, 0, 1},
    port: port,
    cipher_suite: :strong,
    keyfile: "priv/cert/selfsigned_key.pem",
    certfile: "priv/cert/selfsigned.pem"
  ],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "UHZ0Lf/EGdIYNHWwTKoowoRJt+HFsrP8iwKPp/2XthQYE2BhRhjtfGJDLU0b70HI",
  watchers: [
    esbuild: {Esbuild, :install_and_run, [:ride_along, ~w(--sourcemap=inline --watch #{sentry_dsn_define})]},
    tailwind: {Tailwind, :install_and_run, [:ride_along, ~w(--watch)]}
  ]

# Watch static and templates for browser reloading.
config :ride_along, RideAlongWeb.Endpoint,
  live_reload: [
    patterns: [
      ~r"priv/static/(?!uploads/).*(js|css|png|jpeg|jpg|gif|svg)$",
      ~r"priv/gettext/.*(po)$",
      ~r"lib/ride_along_web/(controllers|live|components)/.*(ex|heex)$"
    ]
  ]

config :ride_along, RideAlongWeb.PageController, redirect_to: nil

# Enable dev routes for dashboard and mailbox
config :ride_along, dev_routes: true
