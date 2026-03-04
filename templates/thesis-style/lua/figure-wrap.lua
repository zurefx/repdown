-- figure-wrap.lua
-- Fuerza que cualquier imagen inline (sin float) se convierta
-- en un bloque figure centrado con caption.
-- Pandoc solo crea figure automáticamente si la imagen está SOLA en su párrafo.
-- Este filtro captura imágenes dentro de párrafos mixtos y las extrae.

function Para(el)
  -- Buscar si el párrafo contiene exactamente una imagen y nada más
  if #el.content == 1 and el.content[1].t == "Image" then
    local img = el.content[1]
    return pandoc.Para(el.content)  -- déjalo, Pandoc lo maneja como figure
  end

  -- Si el párrafo tiene una imagen MEZCLADA con texto:
  -- extraer la imagen y convertirla en RawBlock figure centrado
  local blocks = {}
  local text_before = {}
  local text_after = {}
  local found_image = nil
  local after_image = false

  for _, inline in ipairs(el.content) do
    if inline.t == "Image" then
      found_image = inline
      after_image = true
    elseif after_image then
      table.insert(text_after, inline)
    else
      table.insert(text_before, inline)
    end
  end

  -- Si no hay imagen, devolver el párrafo tal cual
  if not found_image then
    return el
  end

  local result = {}

  -- Texto antes de la imagen
  if #text_before > 0 then
    -- Limpiar espacios finales
    while #text_before > 0 and text_before[#text_before].t == "Space" do
      table.remove(text_before)
    end
    if #text_before > 0 then
      table.insert(result, pandoc.Para(text_before))
    end
  end

  -- Bloque figure con la imagen centrada
  -- Construir caption desde el alt text de la imagen
  local caption_text = ""
  for _, c in ipairs(found_image.caption) do
    if c.t == "Str" then
      caption_text = caption_text .. c.text
    elseif c.t == "Space" then
      caption_text = caption_text .. " "
    end
  end

  local src = found_image.src
  local latex_figure = "\\begin{figure}[H]\n\\centering\n\\includegraphics[width=\\maxwidth,keepaspectratio]{" .. src .. "}\n"
  if caption_text ~= "" and caption_text ~= "image" then
    latex_figure = latex_figure .. "\\caption{" .. caption_text .. "}\n"
  end
  latex_figure = latex_figure .. "\\end{figure}"

  table.insert(result, pandoc.RawBlock("latex", latex_figure))

  -- Texto después de la imagen
  if #text_after > 0 then
    -- Limpiar espacios iniciales
    while #text_after > 0 and text_after[1].t == "Space" do
      table.remove(text_after, 1)
    end
    if #text_after > 0 then
      table.insert(result, pandoc.Para(text_after))
    end
  end

  return result
end
