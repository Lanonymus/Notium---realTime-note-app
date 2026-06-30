// 1. Definiujemy czyste, profesjonalne zestawy stylów dla biblioteki
const IMAGE_ALIGNMENT_STYLES = {
  left: {
    wrapperStyle: "display: inline-block; float: left; padding-right: 1rem; margin-bottom: 0.5rem; height: auto !important; line-height: 0 !important;",
    containerStyle: "display: inline-block; height: auto !important; line-height: 0 !important;"
  },
  center: {
    wrapperStyle: "display: block; margin: 1.5rem auto; clear: both; text-align: center; height: auto !important; line-height: 0 !important;",
    containerStyle: "display: inline-block; margin: 0 auto; height: auto !important; line-height: 0 !important;"
  },
  right: {
    wrapperStyle: "display: inline-block; float: right; padding-left: 1rem; margin-bottom: 0.5rem; height: auto !important; line-height: 0 !important;",
    containerStyle: "display: inline-block; height: auto !important; line-height: 0 !important;"
  }
};

// 2. Czysta funkcja zmieniająca stan węzła
const setImageAlignment = (alignment: 'left' | 'center' | 'right', editor: any) => {
  const styles = IMAGE_ALIGNMENT_STYLES[alignment];

  if (!styles) return;

  // Wstrzykujemy dokładnie te parametry struktury, których szuka rozszerzenie
  editor.chain().focus().updateAttributes('imageResize', { 
    wrapperStyle: styles.wrapperStyle,
    containerStyle: styles.containerStyle
  }).run();
};

export default setImageAlignment;