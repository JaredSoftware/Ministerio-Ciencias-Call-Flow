<template>
  <div class="form-check form-check-inline">
    <input
      class="form-check-input"
      type="radio"
      name="inlineRadioOptions"
      id="inlineRadio1"
      value="1"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <label class="form-check-label" for="inlineRadio1">{{ name }}</label>
  </div>
  <div class="form-check form-check-inline">
    <input
      class="form-check-input"
      type="radio"
      name="inlineRadioOptions"
      id="inlineRadio2"
      value="2"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <label class="form-check-label" for="inlineRadio2">{{ name2 }}</label>
  </div>
  <!--
  <div class="form-check">
    <input class="form-check-input" type="radio" :name="name" :id="id" :checked="checked" />
    <label :for="id" class="custom-control-label">
      <slot />
    </label>
  </div>--->
</template>

<script>
export default {
  name: "argon-checkbox",
  props: {
    name: String,
    name2:String,
    id: String,
    checked: String,
    modelValue:Number,
  },
  emits: ['update:modelValue'],
};
</script>
