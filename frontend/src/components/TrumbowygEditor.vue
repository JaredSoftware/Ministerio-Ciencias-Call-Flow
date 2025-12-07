<template>
  <div class="trumbowyg-wrapper">
    <div v-if="!isLoaded" class="loading-editor">
      <div class="spinner-border spinner-border-sm text-primary" role="status">
        <span class="visually-hidden">Cargando editor...</span>
      </div>
      <span class="ms-2">Cargando editor...</span>
    </div>
    <div :id="editorId" ref="editorElement" v-show="isLoaded"></div>
  </div>
</template>

<script>
export default {
  name: 'TrumbowygEditor',
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    config: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue', 'change', 'focus', 'blur'],
  data() {
    return {
      editorId: `trumbowyg-${Math.random().toString(36).substr(2, 9)}`,
      editorInstance: null,
      isInitialized: false,
      isLoaded: false,
      scriptsLoaded: false
    };
  },
  watch: {
    modelValue(newValue) {
      if (this.editorInstance && this.isInitialized) {
        const currentHtml = this.editorInstance.trumbowyg('html') || '';
        if (newValue !== currentHtml) {
          this.editorInstance.trumbowyg('html', newValue || '');
        }
      }
    }
  },
  mounted() {
    this.loadScripts();
  },
  beforeUnmount() {
    this.destroyEditor();
  },
  methods: {
    loadScript(url) {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    },
    loadStyle(href) {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`link[href="${href}"]`)) {
          resolve();
          return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
      });
    },
    async loadScripts() {
      try {
        // Cargar jQuery si no está disponible
        if (typeof window.$ === 'undefined' || typeof window.jQuery === 'undefined') {
          await this.loadScript('https://code.jquery.com/jquery-3.6.0.min.js');
        }

        // Cargar CSS de Trumbowyg
        await this.loadStyle('https://cdn.jsdelivr.net/npm/trumbowyg@2.25.1/dist/ui/trumbowyg.min.css');

        // Cargar JS de Trumbowyg
        await this.loadScript('https://cdn.jsdelivr.net/npm/trumbowyg@2.25.1/dist/trumbowyg.min.js');

        // Cargar plugin de colores
        await this.loadScript('https://cdn.jsdelivr.net/npm/trumbowyg@2.25.1/dist/plugins/colors/trumbowyg.colors.min.js');

        // Cargar CSS del plugin de colores
        await this.loadStyle('https://cdn.jsdelivr.net/npm/trumbowyg@2.25.1/dist/plugins/colors/ui/trumbowyg.colors.min.css');

        // Cargar idioma español si está disponible
        try {
          await this.loadScript('https://cdn.jsdelivr.net/npm/trumbowyg@2.25.1/dist/langs/es.min.js');
        } catch (e) {
          console.warn('No se pudo cargar el idioma español:', e);
        }

        this.scriptsLoaded = true;
        this.$nextTick(() => {
          this.initEditor();
        });
      } catch (error) {
        console.error('Error cargando scripts de Trumbowyg:', error);
        this.$refs.editorElement.innerHTML = `
          <textarea class="form-control" rows="10" placeholder="Error cargando editor. Por favor recarga la página.">${this.modelValue}</textarea>
        `;
      }
    },
    initEditor() {
      if (!this.scriptsLoaded || !window.$ || !window.$.fn.trumbowyg) {
        console.error('Trumbowyg no está disponible');
        return;
      }

      this.$nextTick(() => {
        if (!this.$refs.editorElement) {
          return;
        }

        try {
          // Configuración por defecto
          const lang = (window.$ && window.$.trumbowyg && window.$.trumbowyg.langs && window.$.trumbowyg.langs.es) ? 'es' : 'en';
          
          // Lista de colores personalizada: blanco, negro, verde, azul, rojo, amarillo, etc.
          const colorList = [
            '000000', // Negro
            'FFFFFF', // Blanco
            'FF0000', // Rojo
            '00FF00', // Verde
            '0000FF', // Azul
            'FFFF00', // Amarillo
            'FF00FF', // Magenta
            '00FFFF', // Cian
            'FFA500', // Naranja
            '800080', // Púrpura
            '008000', // Verde oscuro
            '000080', // Azul oscuro
            '800000', // Marrón
            '808080', // Gris
            'FFC0CB', // Rosa
            'A52A2A', // Café
            'FFD700', // Dorado
            '00CED1', // Turquesa
            'FF6347', // Tomate
            '32CD32'  // Verde lima
          ];

          const defaultConfig = {
            lang: lang,
            semantic: true,
            resetCss: true,
            autogrow: true,
            removeformatPasted: true,
            btns: [
              ['viewHTML'],
              ['undo', 'redo'],
              ['formatting'],
              ['strong', 'em', 'del'],
              ['foreColor', 'backColor'], // Colores de texto y fondo
              ['superscript', 'subscript'],
              ['link'],
              ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
              ['unorderedList', 'orderedList'],
              ['horizontalRule'],
              ['removeformat'],
              ['fullscreen']
            ],
            plugins: {
              colors: {
                foreColorList: colorList,
                backColorList: colorList
              }
            },
            ...this.config
          };

          const $editor = window.$(this.$refs.editorElement);
          $editor.trumbowyg(defaultConfig);

          this.editorInstance = $editor;
          this.isLoaded = true;

          // Establecer contenido inicial
          if (this.modelValue) {
            $editor.trumbowyg('html', this.modelValue);
          }

          // Eventos
          $editor.on('tbwchange', () => {
            const html = $editor.trumbowyg('html') || '';
            this.$emit('update:modelValue', html);
            this.$emit('change', html);
          });

          $editor.on('tbwfocus', () => {
            this.$emit('focus');
          });

          $editor.on('tbwblur', () => {
            this.$emit('blur');
          });

          this.isInitialized = true;
        } catch (error) {
          console.error('Error inicializando editor:', error);
          this.$refs.editorElement.innerHTML = `
            <textarea class="form-control" rows="10" placeholder="Error inicializando editor.">${this.modelValue}</textarea>
          `;
        }
      });
    },
    destroyEditor() {
      if (this.editorInstance && window.$ && window.$.fn.trumbowyg) {
        try {
          this.editorInstance.trumbowyg('destroy');
        } catch (error) {
          console.error('Error destruyendo editor:', error);
        }
      }
      this.editorInstance = null;
      this.isInitialized = false;
    },
    getHtml() {
      if (this.editorInstance && window.$) {
        return this.editorInstance.trumbowyg('html') || '';
      }
      return '';
    },
    setHtml(html) {
      if (this.editorInstance && window.$) {
        this.editorInstance.trumbowyg('html', html || '');
      }
    }
  }
};
</script>

<style scoped>
.trumbowyg-wrapper {
  width: 100%;
}

.loading-editor {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #6c757d;
}

.trumbowyg-wrapper :deep(.trumbowyg-editor) {
  min-height: 250px;
  font-size: 14px;
}

.trumbowyg-wrapper :deep(.trumbowyg-box) {
  width: 100%;
  margin-bottom: 0;
}

.trumbowyg-wrapper :deep(.trumbowyg-button-pane) {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}
</style>

