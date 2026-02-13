          const visionResponse = await fetch("https://text.pollinations.ai/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "حلل الصورة دي بالتفصيل واوصفها بالعربي المصري. قول إيه اللي في الصورة، الألوان، الأشخاص لو موجودين، الأماكن، وأي تفاصيل مهمة.",
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: dataUrl,
                      },
                    },
                  ],
                },
              ],
              model: "openai",
              seed: 42,
              jsonMode: false,
            }),
          })

          if (!visionResponse.ok) {
            throw new Error(`Vision API error: ${visionResponse.status}`)
          }

          const visionResult = await visionResponse.text()

          analyses.push(
            `🖼️ تحليل الصورة: ${file.name}\n` +
              `- الحجم: ${(file.size / 1024).toFixed(2)} KB\n` +
              `- النوع: ${file.type}\n\n` +
              `📝 الوصف:\n${visionResult}`,
          )
        } catch (visionError) {
          console.error("[v0] Vision analysis error:", visionError)
          analyses.push(
            `🖼️ صورة: ${file.name}\n` +
              `- الحجم: ${(file.size / 1024).toFixed(2)} KB\n` +
              `- النوع: ${file.type}\n` +
              `- تم استلام الصورة بنجاح! لو عايز تحليل مفصل، اسألني عنها.`,
          )
        }
      }
    }

    const analysis = analyses.join("\n\n")

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("File analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze files" }, { status: 500 })
  }
}
