<template>
  <q-page class="constrain q-pa-md" id="pageAddresses">
    <q-dialog v-model="edit" ref="addressDlg">
      <q-card style="min-width: 500px">
        <q-card-section>
          <form-address :address="record"> </form-address>
        </q-card-section>
        <q-card-actions align="right" class="text-primary">
          <q-btn flat color="red" label="Delete" @click="deleteAddress" />
          <q-btn flat label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-item class="q-mb-lg">
      <q-item-section>
        <q-input
          label="Filter EthAcct by Name or Eth Acct"
          v-model="filter"
        ></q-input>
      </q-item-section>
      <q-item-section side>
        <q-btn label="Add" @click="addAddress"></q-btn>
      </q-item-section>
    </q-item>
    <q-separator></q-separator>
    <q-table
      dense
      title="Addresses"
      :data="filteredAddresses"
      row-key="address"
      @row-click="editAddress"
      :pagination.sync="pagination"
      :rows-per-page-options="[0]"
    >
      <template v-slot:top-right>
        <q-btn
          color="primary"
          icon-right="archive"
          label="Export to csv"
          no-caps
          @click="exportTable"
        />
        <q-btn
          class="q-ml-lg"
          color="negative"
          label="Clear Unnamed"
          @click="clearUnnamed"
        />
      </template>
    </q-table>
  </q-page>
</template>

<script>
import { store } from "../boot/store";
import { actions } from "../boot/actions";
import FormAddress from "src/components/FormAddress.vue";
import { convertToCsv } from "src/utils/arrayUtil";
import { exportFile } from "quasar";
export default {
  name: "PageAddresses",
  data() {
    return {
      filter: "",
      addresses: store.addresses,
      pagination: {
        rowsPerPage: 0
      },
      edit: false,
      record: null,
      updatedRecord: null,
      $store: store,
      $actions: actions
    };
  },
  components: {
    FormAddress
  },
  computed: {
    filteredAddresses() {
      if (this.filter.length == 0) return this.addresses;
      const filter = this.filter;
      const filtered = this.addresses.filter(function(a) {
        return (
          (a.name && a.name.toLowerCase().includes(filter.toLowerCase())) ||
          (a.address && a.address.toLowerCase().includes(filter.toLowerCase()))
        );
      });

      return filtered;
    }
  },
  methods: {
    editAddress(evt, row, index) {
      this.record = row;
      this.edit = true;
    },
    addAddress() {
      this.addresses.push({
        address: null,
        name: null,
        isContract: false,
        balance: 0.0,
        owned: false
      });
      this.record = this.addresses[this.addresses.length - 1];
      this.edit = true;
    },
    deleteAddress(val) {
      this.$q
        .dialog({
          title: "Confirm",
          message: "Would you like to delete this account?",
          cancel: true,
          persistent: true
        })
        .onOk(() => {
          const savedAddresses = this.addresses.filter(
            a => a.address != this.record.address
          );
          this.addresses = savedAddresses;
          this.$refs.addressDlg.hide();
        });
    },
    exportTable() {
      const simpleAddress = this.$store.addresses.map(a => {
        return { address: a.address, name: a.name, type: a.type };
      });
      const names = ["address", "name", "type"];
      const content = convertToCsv(simpleAddress, names);
      const status = exportFile("addresses.csv", content, "text/csv");
      if (status !== true) {
        this.$q.notify({
          message: "Browser denied file download...",
          color: "negative",
          icon: "warning"
        });
      }
    },
    clearUnnamed() {
      const namedAddresses = this.$store.addresses.filter(
        a => a.name.substring(0, 2) != "0x"
      );
      this.addresses = namedAddresses;
    }
  },
  watch: {
    //   "record.name": {
    //     handler: function(newVal, oldVal) {
    //       // console.log("new", newVal);
    //       // console.log("old", oldVal);
    //       // console.log(this.record);
    //       this.updatedRecord = this.record;
    //     }
    //   },
    //   edit: {
    //     handler: function(newVal, oldVal) {
    //       if (oldVal && this.updatedRecord) {
    //         console.log(this.updatedRecord.name);
    //         for (const ct of this.$store.chainTransactions) {
    //           if (ct.toAccount.address == this.updatedRecord.address) {
    //             ct.toName = this.updatedRecord.name;
    //           }
    //           if (ct.fromAccount.address == this.updatedRecord.address) {
    //             ct.fromName = this.updatedRecord.name;
    //           }
    //         }
    //         this.$actions.setLocalStorage(
    //           "chainTransactions",
    //           this.$store.chainTransactions
    //         );
    //       }
    //     }

    addresses: {
      handler: function(val) {
        actions.setObservableData("addresses", val);
      },
      deep: true
    }
  },
  mounted() {
    window.__vue_mounted = "PageAddresses";
  }
};
</script>
