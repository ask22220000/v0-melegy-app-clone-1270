                page_path: data.pagePath,
              })
            }
          }
        } catch (sessionError) {
          console.error("[v0] Error tracking session:", sessionError)
          // Fail silently - don't crash the user experience
        }
        break

      case "trackUser":
        try {
          const userIdentifierForTrack = data.userFingerprint || data.userIp || "unknown"

          const { data: existingUserForTrack } = await supabase
            .from("users")
            .select("id")
            .eq("user_ip", userIdentifierForTrack)
            .maybeSingle()

          if (existingUserForTrack) {
            await supabase
              .from("users")
              .update({
                last_active_at: new Date().toISOString(),
              })
              .eq("id", existingUserForTrack.id)
          } else {
            const { data: newUserForTrack } = await supabase
              .from("users")
              .insert({
                user_ip: userIdentifierForTrack,
                device_info: data.deviceInfo || "unknown",
              })
              .select("id")
              .maybeSingle()

            if (newUserForTrack) {
              await supabase.from("subscriptions").insert({
                user_id: newUserForTrack.id,
                plan_name: "free",
                status: "active",
              })
            }
          }
        } catch (userTrackError) {
          console.error("[v0] Error tracking user:", userTrackError)
          // Fail silently - don't crash the user experience
        }
        break

      default:
        return Response.json({ error: "Invalid action" }, { status: 400 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Analytics tracking error:", error)
    return Response.json({ error: "Failed to track analytics" }, { status: 500 })
  }
}
