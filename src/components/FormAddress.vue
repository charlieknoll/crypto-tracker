<template>
  <!-- <q-card>
    TESt
  </q-card> -->
  <q-form>
    <div class="row">
      <div class="col-12 col-sm-8">
        <q-input v-model="value.name" label="Name"></q-input>
      </div>
      <div class="col-12 col-sm-4">
        <q-select v-model="value.type" :options="options" label="Type" />
      </div>
    </div>
    <q-input v-model="value.address" label="Eth Acct"></q-input>
    <q-input v-model="value.chains" label="Chains"></q-input>
  </q-form>
</template>

<script>
export default {
  name: "FormAddress",
  props: ["modelValue"],
  computed: {
    value: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit("update:modelValue", value);
      },
    },
  },

  data() {
    return {
      options: [
        "Owned",
        "Exchange Owned",
        "Contract Owned",
        "Gift",
        "Token",
        "Tax Deductible Donation",
        "Spending",
        "Expense",
        "Income",
      ],
    };
  },
};
</script>

<style></style>
