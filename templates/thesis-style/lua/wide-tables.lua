-- wide-tables.lua
-- Convierte tablas de Pandoc a full-width con anchos proporcionales inteligentes
-- Centra el contenido de todas las celdas

function Table(el)
  local ncols = #el.colspecs
  if ncols == 0 then return el end

  -- Anchos proporcionales según número de columnas
  local widths = {}
  if ncols == 2 then
    widths = {0.35, 0.65}
  elseif ncols == 3 then
    widths = {0.25, 0.40, 0.35}
  elseif ncols == 4 then
    widths = {0.20, 0.30, 0.30, 0.20}
  else
    local w = 1.0 / ncols
    for i = 1, ncols do widths[i] = w end
  end

  for i, colspec in ipairs(el.colspecs) do
    -- Forzar centrado en todas las columnas
    el.colspecs[i] = {pandoc.AlignCenter, widths[i] or (1.0 / ncols)}
  end

  return el
end
