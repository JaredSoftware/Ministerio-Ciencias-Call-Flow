<template>
  <div>
    <button
      ref="popoverTrigger"
      @mouseenter="showPopover"
      @mouseleave="hidePopover"
      class="btn btn-primary"
    >
      Mostrar Popover
    </button>
    <div ref="popoverContent" v-show="popoverVisible" class="popover bs-popover-top">
      <div class="arrow"></div>
      <div class="popover-body">
        ¡Hola! Soy un popover que aparece al pasar el cursor.
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      popoverVisible: false,
      popperInstance: null
    };
  },
  methods: {
    showPopover() {
      // Popper deshabilitado temporalmente
      console.log('Popover deshabilitado temporalmente');
    },
    hidePopover() {
      // Popper deshabilitado temporalmente
      console.log('Popover deshabilitado temporalmente');
    },
    createPopper() {
      // Popper deshabilitado temporalmente
      console.log('Popper deshabilitado temporalmente');
    },
    destroyPopper() {
      // Popper deshabilitado temporalmente
      console.log('Popper deshabilitado temporalmente');
    }
  },
  beforeUnmount() {
    // Popper deshabilitado temporalmente
    console.log('Componente Rtl desmontado');
  }
};
</script>

<style>
.popover {
  display: block;
  max-width: 276px;
  background-color: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.3rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.popover .arrow {
  position: absolute;
  display: block;
  width: 0.8rem;
  height: 0.4rem;
  transform: rotate(45deg);
  background-color: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.popover.bs-popover-top .arrow {
  bottom: -0.4rem;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  border-width: 0 0 1px 1px;
}

.popover-body {
  padding: 1rem;
  color: #333;
  font-size: 0.875rem;
}
</style>