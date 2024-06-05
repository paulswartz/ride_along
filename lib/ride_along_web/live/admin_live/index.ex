defmodule RideAlongWeb.AdminLive.Index do
  use RideAlongWeb, :live_view

  # alias RideAlong.Adept
  # alias RideAlong.Adept.Admin

  @impl true
  def mount(_params, _session, socket) do
    {:ok,
     socket
     |> assign(:form, %Phoenix.HTML.Form{})
     |> assign(:iframe_url, nil)}
  end

  @impl true
  def handle_params(_params, _url, socket) do
    {:noreply, socket}
  end
end
