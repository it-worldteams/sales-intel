# Guía de Estilo Visual: [Nombre de tu Empresa]

## 1. Paleta de Colores (Sistema Hexadecimal)

### Colores Base y Marca
- **Primario Corporativo:** `#142D2B` (Verde Petróleo Profundo)
- **Secundario de Marca:** `#57978E` (Verde Menta Desaturado)
- **Color de Acento Principal:** `#D6B7AC` (Arena/Nude)

### Colores de Contraste y UI
- **Fondo Claro (Default):** `#FFF9F5` (Crema muy claro)
- **Texto Principal (Modo Claro):** `#131313` (Negro Carbón)
- **Acento Especial (Vibrante):** `#FB00AA` (Magenta Eléctrico)

### Colores Complementarios / Categorías
- **Deep Purple:** `#3E0D2A`
- **Soft Lavender:** `#FFC0FC`
- **Acid Green:** `#D2F176`

## 2. Tipografía

- **Títulos (Headings):** `Space Grotesk`, sans-serif.
  - *Uso:* H1, H2, H3 y etiquetas de gran tamaño. 
  - *Atributos:* Carácter geométrico y moderno.
- **Cuerpo de texto (Body):** `Manrope`, sans-serif.
  - *Uso:* Párrafos, botones, menús y lectura larga.
  - *Atributos:* Alta legibilidad y equilibrio.

## 3. Especificación de Tema Oscuro (Dark Mode)

Cuando se active el modo oscuro, el agente de IA debe seguir estas reglas de reemplazo:

- **Fondo de pantalla:** Cambiar `#FFF9F5` por `#131313`.
- **Texto Principal:** Cambiar `#131313` por `#FFF9F5`.
- **Contenedores/Tarjetas:** Usar `#142D2B` con una opacidad del 40% sobre el fondo negro o usar directamente el color `#3E0D2A` para secciones destacadas.
- **Acentos:** Mantener `#D2F176` (Acid Green) o `#FFC0FC` (Lavender) para asegurar un alto contraste sobre fondos oscuros.
- **Bordes:** Usar `#57978E` con baja opacidad para delimitar secciones.

## 4. Instrucciones para la IA
1. Al generar código CSS, utiliza variables raíz (`:root`) con estos nombres.
2. Prioriza el uso de `Space Grotesk` para cualquier elemento de jerarquía visual alta.
3. Asegura que el contraste entre `#FB00AA` (Magenta) y los fondos cumpla con las normas de accesibilidad WCAG.