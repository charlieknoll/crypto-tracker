<template>
  <!-- <q-card>
    TESt
  </q-card> -->
  <q-form>
    <div class="row">
      <div class="col-12 col-sm-8">
        <q-input v-model="address.name" label="Name"></q-input>
      </div>
      <div class="col-12 col-sm-4">
        <q-select v-model="address.type" :options="options" label="Type" />
      </div>
    </div>
    <q-input v-model="address.address" label="Eth Acct"></q-input>
  </q-form>
</template>

<script>
export default {
  name: "FormAddress",
  props: ["address"],
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
        "Income"
      ]
    };
  }
};
</script>

<style></style>
