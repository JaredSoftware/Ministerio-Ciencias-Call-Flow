<template>
  <!---
  <div class="container top-0 position-sticky z-index-sticky">
    <div class="row">
      <div class="col-12">
        <navbar isBtn="bg-gradient-light" />
      </div>
    </div>
  </div>
  -->
  <main class="main-content mt-0">
    <div
      class="page-header align-items-start min-vh-50 pt-5 pb-11 m-3 border-radius-lg"
      style="background-image: url('https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-dashboard-pro/assets/img/signup-cover.jpg'); background-position: top;"
    >
      <span class="mask bg-gradient-dark opacity-6"></span>
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-5 text-center mx-auto">
            <h1 class="text-white mb-2 mt-5">Welcome!</h1>
            <p class="text-lead text-white">
              Use these awesome forms to login or create new account in your
              project for free.
            </p>
          </div>
        </div>
      </div>
    </div>
    <div class="container">
      <div class="row mt-lg-n10 mt-md-n11 mt-n10 justify-content-center">
        <div class="col-xl-4 col-lg-5 col-md-7 mx-auto">
          <div class="card z-index-0">
            <div class="card-header text-center pt-4">
              <argon-alert :disabled="disabledPassword">
                <strong>Upsss!</strong> Your password must be equal!
              </argon-alert>
              <argon-alert color="danger" :disabled="disabledUser">
                <strong>Upsss!</strong> {{ email }} exist into application!
              </argon-alert>
              <h5>Register with</h5>
            </div>
            <div class="row px-xl-5 px-sm-4 px-3">
              <div class="col-3 ms-auto px-1">
              </div>
              <div class="col-3 px-1">
                <a
                  class="btn btn-outline-light w-100 disabled"
                  href="javascript:;"
                >
                  <svg
                    width="24px"
                    height="32px"
                    viewBox="0 0 64 64"
                    version="1.1"
                  >
                    <g
                      stroke="none"
                      stroke-width="1"
                      fill="none"
                      fill-rule="evenodd"
                    >
                      <g
                        transform="translate(3.000000, 2.000000)"
                        fill-rule="nonzero"
                      >
                        <path
                          d="M57.8123233,30.1515267 C57.8123233,27.7263183 57.6155321,25.9565533 57.1896408,24.1212666 L29.4960833,24.1212666 L29.4960833,35.0674653 L45.7515771,35.0674653 C45.4239683,37.7877475 43.6542033,41.8844383 39.7213169,44.6372555 L39.6661883,45.0037254 L48.4223791,51.7870338 L49.0290201,51.8475849 C54.6004021,46.7020943 57.8123233,39.1313952 57.8123233,30.1515267"
                          fill="#4285F4"
                        />
                        <path
                          d="M29.4960833,58.9921667 C37.4599129,58.9921667 44.1456164,56.3701671 49.0290201,51.8475849 L39.7213169,44.6372555 C37.2305867,46.3742596 33.887622,47.5868638 29.4960833,47.5868638 C21.6960582,47.5868638 15.0758763,42.4415991 12.7159637,35.3297782 L12.3700541,35.3591501 L3.26524241,42.4054492 L3.14617358,42.736447 C7.9965904,52.3717589 17.959737,58.9921667 29.4960833,58.9921667"
                          fill="#34A853"
                        />
                        <path
                          d="M12.7159637,35.3297782 C12.0932812,33.4944915 11.7329116,31.5279353 11.7329116,29.4960833 C11.7329116,27.4640054 12.0932812,25.4976752 12.6832029,23.6623884 L12.6667095,23.2715173 L3.44779955,16.1120237 L3.14617358,16.2554937 C1.14708246,20.2539019 0,24.7439491 0,29.4960833 C0,34.2482175 1.14708246,38.7380388 3.14617358,42.736447 L12.7159637,35.3297782"
                          fill="#FBBC05"
                        />
                        <path
                          d="M29.4960833,11.4050769 C35.0347044,11.4050769 38.7707997,13.7975244 40.9011602,15.7968415 L49.2255853,7.66898166 C44.1130815,2.91684746 37.4599129,0 29.4960833,0 C17.959737,0 7.9965904,6.62018183 3.14617358,16.2554937 L12.6832029,23.6623884 C15.0758763,16.5505675 21.6960582,11.4050769 29.4960833,11.4050769"
                          fill="#EB4335"
                        />
                      </g>
                    </g>
                  </svg>
                </a>
              </div>
              <div class="col-3 me-auto px-1">
              </div>
              <div class="mt-2 position-relative text-center">
                <p
                  class="text-sm font-weight-bold mb-2 text-white text-border d-inline z-index-2 bg-white px-3"
                >
                  or
                </p>
              </div>
            </div>
            <div class="card-body">
              <form role="form" @submit.prevent="submit()">
                <argon-input
                  type="text"
                  placeholder="Name"
                  aria-label="Name"
                  isRequired
                  :modelValue="name"
                  @update:modelValue="(newValue) => (name = newValue)"
                />
                <argon-input
                  type="text"
                  placeholder="Last Name"
                  aria-label="LastName"
                  isRequired
                  :modelValue="lastName"
                  @update:modelValue="(newValue) => (lastName = newValue)"
                />
                <argon-input
                  type="text"
                  placeholder="Phone"
                  aria-label="Phone"
                  isRequired
                  :modelValue="Phone"
                  @update:modelValue="(newValue) => (Phone = newValue)"
                />
                <argon-input
                  type="text"
                  placeholder="Identificación"
                  aria-label="ID"
                  isRequired
                  :modelValue="ID"
                  @update:modelValue="(newValue) => (ID = newValue)"
                />
                <argon-input
                  type="email"
                  placeholder="Email"
                  aria-label="Email"
                  isRequired
                  :modelValue="email"
                  @update:modelValue="(newValue) => (email = newValue)"
                />
                <argon-input
                  type="password"
                  placeholder="Password"
                  aria-label="Password"
                  isRequired
                  :modelValue="password"
                  @update:modelValue="(newValue) => (password = newValue)"
                />
                <argon-input
                  type="password"
                  placeholder="confirm password"
                  aria-label="Password"
                  isRequired
                  :modelValue="repassword"
                  @update:modelValue="(newValue) => (repassword = newValue)"
                />
                <argon-checkbox checked>
                  <label class="form-check-label" for="flexCheckDefault">
                    I agree the
                    <a href="javascript:;" class="text-white font-weight-bolder"
                      >Terms and Conditions</a
                    >
                  </label>
                </argon-checkbox>
                <div class="mt-2 position-relative text-center">
                  <p
                    class="text-sm font-weight-bold mb-2 text-white text-border d-inline z-index-2 bg-white px-3"
                  ></p>
                </div>
                <div class="text-center">
                  <argon-button
                    fullWidth
                    color="dark"
                    variant="gradient"
                    class="my-4 mb-2"
                    >Sign up</argon-button
                  >
                </div>
                <p class="text-sm mt-3 mb-0">
                  Already have an account?
                  <a href="/signin" class="text-dark font-weight-bolder"
                    >Sign in</a
                  >
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
//import Navbar from "@/examples/PageLayout/Navbar.vue";
import ArgonInput from "@/components/ArgonInput.vue";
import ArgonCheckbox from "@/components/ArgonCheckbox.vue";
//import ArgonCheckboxRadio from "@/components/ArgonCheckboxRadio.vue";
import ArgonButton from "@/components/ArgonButton.vue";
import Login from "@/router/services/LoginService";
import ArgonAlert from "@/components/ArgonAlert.vue";
const body = document.getElementsByTagName("body")[0];

export default {
  name: "signin",
  data() {
    return {
      name: "",
      lastName: "",
      Phone: "",
      email: "",
      ID: "",
      password: "",
      repassword: "",
      disabledPassword: false,
      disabledUser: false,
    };
  },
  components: {
    //Navbar,
    ArgonAlert,
    ArgonInput,
    ArgonCheckbox,
    ArgonButton,
    //ArgonCheckboxRadio,
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
  methods: {
    async submit() {
      if (this.password == this.repassword) {
        const existsUser = await Login.validateUser(this.$data);
        if (!existsUser.user) {
          this.disabledPassword = false;
          this.disabledUser = false;
          await Login.addUser(this.$data);
          this.$router.push("/signin");
        } else {
          this.disabledUser = true;
        }
      } else {
        this.disabledPassword = true;
      }
    },
  },
};
</script>
