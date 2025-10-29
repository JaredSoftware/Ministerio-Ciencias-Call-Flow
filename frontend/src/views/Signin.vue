<template>
  <!---
  <div class="container top-0 position-sticky z-index-sticky">
    <div class="row">
      <div class="col-12">
        <navbar
          isBlur="blur  border-radius-lg my-3 py-2 start-0 end-0 mx-4 shadow"
          v-bind:darkMode="true"
          isBtn="bg-gradient-success"
        />
      </div>
    </div>
  </div> 
  ---->
  <main class="mt-0 main-content">
    <section>
      <div class="page-header min-vh-100">
        <div class="container">
          <div class="row">
            <div
              class="mx-auto col-xl-4 col-lg-5 col-md-7 d-flex flex-column mx-lg-0"
            >
              <argon-alert color="warning" :disabled="passwordDisabled">
                <strong>Upsss!</strong> Your password is wrong!
              </argon-alert>
              <argon-alert color="danger" :disabled="emailDisabled">
                <strong>Upsss!</strong> this account {{ email }} is disabled or not exists contact support!
              </argon-alert>
              <div class="card">
                <div class="pb-0 card-header text-start">
                  <h4 class="font-weight-bolder">Sign In</h4>
                  <p class="mb-0">Enter your email and password to sign in</p>
                </div>
                <div class="card-body">
                  <form role="form" @submit.prevent="submit()">
                    <div class="mb-3">
                      <argon-input
                        type="email"
                        placeholder="Email"
                        name="email"
                        size="lg"
                        isRequired
                        :modelValue="email"
                        @update:modelValue="(newValue) => (email = newValue)"
                      />
                    </div>
                    <div class="mb-3">
                      <argon-input
                        type="password"
                        placeholder="Password"
                        name="password"
                        size="lg"
                        isRequired
                        :modelValue="password"
                        @update:modelValue="(newValue) => (password = newValue)"
                      />
                    </div>

                    <div class="text-center">
                      <argon-button
                        class="mt-4"
                        variant="gradient"
                        color="dark"
                        fullWidth
                        size="lg"
                        >Sign in</argon-button
                      >
                    </div>
                  </form>
                </div>
                <div class="card-footer px-1 pt-0 text-center px-lg-2">
                  <p class="mx-auto mb-4 text-sm">
                    Don't have an account?
                    <a
                      href="/signup"
                      class="text-dark text-gradient font-weight-bold"
                      >Sign up</a
                    >
                  </p>
                </div>
              </div>
            </div>
            <div
              class="top-0 my-auto text-center col-6 d-lg-flex d-none h-100 pe-0 position-absolute end-0 justify-content-center flex-column"
            >
              <div
                class="position-relative bg-gradient-primary h-100 m-3 px-7 border-radius-lg d-flex flex-column justify-content-center overflow-hidden"
                style="
                  background-image: url('https://minciencias.gov.co/sites/default/files/logo_ciencias.png');
                  background-size: cover;
                "
              >
                <span class="mask bg-gradient-success opacity-6"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script>
//import Navbar from "@/examples/PageLayout/Navbar.vue";
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import Login from "@/router/services/LoginService";
import sessionSync from "@/router/services/sessionSync";
import ArgonAlert from "@/components/ArgonAlert.vue";
import qs from "qs";
const body = document.getElementsByTagName("body")[0];

import { mapMutations } from "vuex";

export default {
  data() {
    return {
      email: "",
      password: "",
      passwordDisabled: false,
      emailDisabled: false,
    };
  },
  methods: {
    ...mapMutations(["makelogin", "setToken","setRole","setRoleToken"]),
    async submit() {
      console.log('🔐 Iniciando proceso de login...');
      const getInfoForLogin = await Login.sendLogin(this.$data);
      
      if (getInfoForLogin.user) {
        if (getInfoForLogin.login) {
          console.log('✅ Login exitoso, procesando tokens...');
          this.passwordDisabled = false;
          this.emailDisabled = false;
          
          // Tu lógica de autenticación aquí
          const token = getInfoForLogin.token;
          //const roleToken = getInfoForLogin.tokenRole;
          
          // Luego de autenticar correctamente, guardar el token en el store
          this.setToken(token);
          this.setRole(getInfoForLogin.role.nombre)
          this.setRoleToken(getInfoForLogin.tokenRole);
          // Cambio a sessionStorage para que cada pestaña sea independiente
          sessionStorage.setItem('user', qs.stringify(getInfoForLogin.user));
          
          // SINCRONIZAR SESIÓN EXPRESS ANTES DE REDIRIGIR
          console.log('🔄 Sincronizando sesión con Express...');
          try {
            const syncResult = await sessionSync.syncSession();
            if (syncResult.success) {
              console.log('✅ Sesión sincronizada exitosamente:', syncResult.user.name);
            } else {
              console.log('⚠️ No se pudo sincronizar sesión:', syncResult.message);
            }
          } catch (syncError) {
            console.error('❌ Error sincronizando sesión:', syncError);
          }

          // Redirigir al dashboard
          this.$store.dispatch("login", { token, user: getInfoForLogin.user });
          console.log('🏠 Redirigiendo al dashboard...');
          this.$router.push("/dashboard");
        } else {
          this.passwordDisabled = true;
          this.emailDisabled = false;
        }
      } else {
        this.emailDisabled = true;
        this.passwordDisabled = false;
      }
    },
  },
  name: "signin",
  components: {
    //Navbar,
    ArgonAlert,
    ArgonInput,
    ArgonButton,
  },
  created() {
    this.$store.state.hideConfigButton = true;
    this.$store.state.showNavbar = false;
    this.$store.state.showSidenav = false;
    this.$store.state.showFooter = false;
    body.classList.remove("bg-gray-100");
  },
  beforeUnmount() {
    this.$store.state.hideConfigButton = false;
    this.$store.state.showNavbar = true;
    this.$store.state.showSidenav = true;
    this.$store.state.showFooter = true;
    body.classList.add("bg-gray-100");
  },
};
</script>
