<template>
  <footer class="py-3 footer">
    <div class="container-fluid">
      <div class="row align-items-center justify-content-lg-between">
        <div class="mb-4 col-lg-6 mb-lg-0">
          <div
            class="text-sm text-center copyright text-muted"
            :class="this.$store.state.isRTL ? 'text-lg-end' : 'text-lg-start'"
          >
            ©
            {{ new Date().getFullYear() }}, made by
            <strong>Ministerio de Ciencia, Tecnología e Innovación</strong>
          </div>
        </div>
        <div class="col-lg-6">
          <ul
            class="nav nav-footer justify-content-center justify-content-lg-end"
          >
            <li class="nav-item">
              <a
                href="https://minciencias.gov.co"
                class="nav-link text-muted"
                target="_blank"
                >Minciencias</a
              >
            </li>
            <li class="nav-item">
              <a
                href="https://minciencias.gov.co/quienes-somos"
                class="nav-link text-muted"
                target="_blank"
                >Acerca de</a
              >
            </li>
            <li class="nav-item">
              <a
                href="https://minciencias.gov.co/contacto"
                class="nav-link text-muted"
                target="_blank"
                >Contacto</a
              >
            </li>
            <li class="nav-item">
              <a
                href="https://minciencias.gov.co/terminos-condiciones"
                class="nav-link pe-0 text-muted"
                target="_blank"
                >Términos</a
              >
            </li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: "app-footer",
};
</script>
