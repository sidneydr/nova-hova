import { LightningElement, track, wire, api } from 'lwc';
// IMPORT API
import { getRecord, createRecord } from 'lightning/uiRecordApi';
// IMPORT NAVIGATION
import { NavigationMixin } from 'lightning/navigation';
// IMPORT THE APEX CLASSES
import getOppLines from '@salesforce/apex/OpportunityListController.getOppLines';
import createInvLines from '@salesforce/apex/OpportunityListController.createInvLines';
import fatchPickListValue from '@salesforce/apex/fetchPicklistController.fatchPickListValue'; // 5-04-20
import getOppCurrency from '@salesforce/apex/OpportunityListController.getOppCurrency'; // 5-05-20
import getSumOppLines from '@salesforce/apex/OpportunityListController.getSumOppLines'; // 5-07-20
import getInvoiceName from '@salesforce/apex/OpportunityListController.getInvoiceName'; // 5-07-20
//import getInvoiceName from '@salesforce/apex/OpportunityListController.getInvoiceName'; // 5-06-20
// IMPORT TOAST
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// GET INVOICE THESE FIELDS
import INVOICE_OBJECT from '@salesforce/schema/Invoice__c';
import INVOICE_ACCOUNTMD_FIELD from '@salesforce/schema/Invoice__c.Account__c';
import INVOICE_OPPLKP_FIELD from '@salesforce/schema/Invoice__c.OpportunityId__c';
// 5-04-20 - Invoice Header fields
import INVOICE_BILLTOACCLKP_FIELD from '@salesforce/schema/Invoice__c.BillingToAccountId__c';
import INVOICE_REFERENCE_FIELD from '@salesforce/schema/Invoice__c.Reference__c';
import INVOICE_REMARKS_FIELD from '@salesforce/schema/Invoice__c.Remarks__c';
import INVOICE_TAXTYPE_FIELD from '@salesforce/schema/Invoice__c.LineAmountTaxType__c';
import INVOICE_CURRENCY_FIELD from '@salesforce/schema/Invoice__c.CurrencyIsoCode';
import INVOICE_OWNER_FIELD from '@salesforce/schema/Invoice__c.Owner__c';

/*
const table_columns = [
    { label: 'Product Name', fieldName: 'Product__r.Name', type: 'text'},
    { label: 'Product Code', fieldName: 'ProductCode__c', type: 'text' },
    { label: 'Quantity', fieldName: 'Quantity__c', type: 'number' },
    { label: 'Discount', fieldName: 'Discount__c', type: 'percent'}, // 5-04-20
    { label: 'Discount Amount', fieldName: 'DiscountAmount__c', type: 'currency', typeAttributes: { currencyCode: 'USD'}},
    { label: 'Total', fieldName: 'LineTotal__c', type: 'currency', typeAttributes: { currencyCode: 'USD'}}, 
];
*/

// 5-04-20
const table_columns = [
    /* Show Product Name column with link
    {
        label: 'Product Name',
        fieldName: 'nameUrl',
        type: 'url',
        typeAttributes: {label: { fieldName: 'ProductName' }},
        sortable: false
    },
    */
    // Show Product Name only with NO link
    { label: 'Product Name', fieldName: 'ProductName', type: 'text'},
    { label: 'Product Code', fieldName: 'Code', type: 'text' },
    { label: 'Quantity', fieldName: 'Quantity', type: 'number' },
    { label: 'Discount', fieldName: 'Discount', type: 'percent'},
    { label: 'Discount Amount', fieldName: 'DiscountAmount', type: 'currency', typeAttributes: { currencyCode: 'USD'}},
    { label: 'Total', fieldName: 'InvoiceTotal', type: 'currency', typeAttributes: { currencyCode: 'USD'}}, 
];

const FIELDS = [
    'Opportunity__c.Id',
    'Opportunity__c.Name',
    'Opportunity__c.AccountId__c',
    'Opportunity__c.CurrencyIsoCode',
    'Opportunity__c.Owner__c'
    ];

export default class CreateInvoice extends NavigationMixin (LightningElement) {
    @track searchKey = '';
    @api recordId;
    @track currentResult1;
    @track currentResult2;
    //@track recordsCount = 0; // 5-08-20 removed
    // 5-04-20
    @track oppLines = []; // 5-07-20 added =[]
    // 5-05-20
    @track currencyResult;
    // 5-07-20
    @track preSelectedRows = [];
    // 5-08-20
    savedRecordId;

    // 5-04-20 (Invoice Header - Billing To Account lookup field input)
    @api childObjectApiName = 'Invoice__c';
    @api targetFieldApiName = 'BillingToAccountId__c';
    @track ref = INVOICE_REFERENCE_FIELD;
    @track rem = INVOICE_REMARKS_FIELD;
    @track billtoacc = INVOICE_BILLTOACCLKP_FIELD;
    // 5-06-20
    @track taxt = INVOICE_BILLTOACCLKP_FIELD;
    
    rec = {
        Reference : this.ref,
        Remarks : this.rem,
        BillingToAccount : this.billtoacc,
        TaxType : this.taxt
    }
    // ---

    selectedRecords = [];
    columns = table_columns;

    /* -- original --
    @wire(getOppLines, { searchKey: '$searchKey' })
    oppLines;
    */

    // 5-05-20 Wire Opportunity Line records
    @wire(getOppLines, { searchKey: '$searchKey' }) wired(result) {
        this.refreshTable = result;
        if (result.data) {
            let preparedOppLines = [];
            result.data.forEach(oppLine => {
                let preparedOppLine = {};
                preparedOppLine.id = oppLine.Id;
                preparedOppLine.Name = oppLine.Name;
                preparedOppLine.Opportunity_Id = oppLine.OpportunityId__c;
                preparedOppLine.ProductId = oppLine.Product__c; // Gets the Product__c.Id
                preparedOppLine.ProductName = oppLine.ProductName__c; // Gets the Product__c.Name
                preparedOppLine.nameUrl = `/${oppLine.Product__c}`; // Get the URL of product
                preparedOppLine.Code = oppLine.ProductCode__c;
                preparedOppLine.ListPrice = oppLine.ListPrice__c;
                preparedOppLine.SalesPrice = oppLine.SalesPrice__c;
                preparedOppLine.Quantity = oppLine.Quantity__c;
                preparedOppLine.Description = oppLine.Description__c;
                preparedOppLine.Discount = oppLine.Discount__c / 100; // Workaround to get correct percent
                preparedOppLine.Date = oppLine.ServiceDate__c;
                preparedOppLine.DiscountAmount = oppLine.DiscountAmount__c;
                preparedOppLine.InvoiceTotal = oppLine.LineTotal__c;
                // push values
                preparedOppLines.push(preparedOppLine);
            });
            this.oppLines = preparedOppLines;
            // 5-07-20
            setTimeout(() => this.preSelectedRows = this.oppLines.map(record=>record.id));
        }
        if (result.error) {
            this.error = result.error;
        }
    }

    @wire(getRecord, { recordId: '$recordId', fields : FIELDS})
    wiredRecord;
    
    // 5-04-20 wire picklist values of Tax Type from Invoice__c
    @wire(fatchPickListValue, {objInfo: {'sobjectType' : 'Invoice__c'}, 
                               picklistFieldApi: 'LineAmountTaxType__c'}) taxTypeValues;

    // 5-08-20 Retrieve the created Invoice record's Name
    @wire(getRecord, { recordId: '$savedRecordId', fields: [ 'id' ] })
    savedRecordIdWire({data,error}) {
        if (data) {
            // call the apex here
            getInvoiceName({ invoiceId : data.id})
            .then(result => {
                // show toast here
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Invoice "'+result.Name+'" was created.',
                        variant: 'success'
                        }),
                    );
                // NAVIGATE TO INVOICE RECORD PAGE
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                    recordId: data.id,
                    objectApiName: 'Invoice__c',
                    actionName: 'view'
                }});
            })
            .catch(error => {
                this.error = error;
            });
            this.error = undefined;    
        } else if (error) {
            this.error = error;
            this.record = undefined;
        }    
    }

    // init
    connectedCallback(){
        this.searchKey = this.recordId;
        // 5-04-20
        this.rec.BillingToAccount = '';
        this.rec.Reference = '';
        this.rec.Remarks = '';
        this.currentResult1 = 0;
        this.currentResult2 = 0;
        // Get Opportunity currency for init
        getOppCurrency({ opptyId : this.searchKey})
        .then(result => {
            if(result.CurrencyIsoCode != ''){
                this.currencyResult = result.CurrencyIsoCode;
            }
            else{
                this.currencyResult = 'N/A';
            }
        })
        .catch(error => {
            this.error = error;
        });
        // 5-06-20
        this.rec.TaxType = '';


        // 5-07-20 - Places the Sum of InvoiceTotal and DiscountAmount upon load
        getSumOppLines({ opptyId : this.searchKey})
            .then(result => {
                    var discountAmount = 0;
                    var totalSum = 0;
                    let conIds1 = new Set(); // ---
                    for (let i = 0; i < result.length; i++){
                        var a = result[i].DiscountAmount__c;
                        var b = discountAmount;
                        var discountAmount = parseFloat(a) + parseFloat(b);
                        var a = result[i].LineTotal__c;
                        var b = totalSum;
                        var totalSum = parseFloat(a) + parseFloat(b); 
                        conIds1.add(result[i].Id); // ---
                    }
                    this.currentResult1 = discountAmount;
                    this.currentResult2 = totalSum; 
                    this.selectedRecords = Array.from(conIds1); // ---
            })
            .catch(error => {
                this.error = error;
            });
    }

    // 5-04-20 (Invoice Header)
    handleChange(event) {
        this.rec.BillingToAccount = event.detail.value[0];
    }

    handleRefChange(event){
        this.rec.Reference = event.detail.value;
    }

    handleRemChange(event){
        this.rec.Remarks = event.detail.value;
    }
    // --- 
    handleTaxChange(event){
        // 5-06-20
        this.rec.TaxType = event.target.value;
    } 
    // ---

    selectedRowsEvent(event) {
        this.currentResult1 = 0;
        this.currentResult2 = 0;
        var discountAmount = 0;
        var totalSum = 0;

        const selectedRows = event.detail.selectedRows;
        //this.recordsCount = event.detail.selectedRows.length; // 5-08-20 removed
        let conIds2 = new Set();
        
        for (let i = 0; i < selectedRows.length; i++){
            var a = selectedRows[i].DiscountAmount; // 5-05-20 changed from DiscountAmount__c to DiscountAmount field
            var b = discountAmount;
            var discountAmount = parseFloat(a) + parseFloat(b);
            var a = selectedRows[i].InvoiceTotal; // 5-05-20 changed from LineAmount__c to InvoiceTotal field
            var b = totalSum;
            var totalSum = parseFloat(a) + parseFloat(b); 
            conIds2.add(selectedRows[i].id);
        }
        this.currentResult1 = discountAmount;
        this.currentResult2 = totalSum;
        this.selectedRecords = Array.from(conIds2);
    }

    /*
    @wire(getRecord, { recordId: '$savedRecordId', fields: [ 'Name' ] })
    savedRecordIdWire({data,error}) {
    // show toast here //
    }
    */
    handleSave() {
        invId;
        invName;
        //invName; 5-06-20
        // 5-05-20
        //invSuccess = false;
        //invLineSucess = false;

        const fields = {};
        // 5-04-20
        fields[INVOICE_REFERENCE_FIELD.fieldApiName] = this.rec.Reference;
        fields[INVOICE_REMARKS_FIELD.fieldApiName] = this.rec.Remarks;
        fields[INVOICE_BILLTOACCLKP_FIELD.fieldApiName] = this.rec.BillingToAccount; 
        // 5-06-20
        if(this.rec.TaxType != ''){
            fields[INVOICE_TAXTYPE_FIELD.fieldApiName] = this.rec.TaxType; 
        }
        fields[INVOICE_CURRENCY_FIELD.fieldApiName] = this.wiredRecord.data.fields.CurrencyIsoCode.value;
        // ---
        // 5-07-20
        fields[INVOICE_OWNER_FIELD.fieldApiName] = this.wiredRecord.data.fields.Owner__c.value;
        // ---
        fields[INVOICE_ACCOUNTMD_FIELD.fieldApiName] = this.wiredRecord.data.fields.AccountId__c.value;
        fields[INVOICE_OPPLKP_FIELD.fieldApiName] = this.wiredRecord.data.fields.Id.value;
        const recordInput = { apiName: INVOICE_OBJECT.objectApiName, fields };
        
        if(this.selectedRecords.length == 0){
            // Shows message to select Opportunity Lines first
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Please add products to the Opportunity first.',
                    //message: 'error.body.message',
                    variant: 'error'
                }),    
            );
        }else{
            // CREATE THE INVOICE RECORD
            createRecord(recordInput)
            .then(invoice => {
                this.message = invoice;
                this.error = undefined;  
                if(this.message !== undefined) {
                    this.invId = invoice.id;
                    // CREATE THE INVOICE LINE RECORDS
                    createInvLines({ lstConIds : this.selectedRecords, invoiceId : this.invId})
                    .then(result => this.savedRecordId = this.invId)//result.id)//; // 5-08-20
                        
                        /* 5-07-20
                        getInvoiceName({ invoiceId : this.invId})
                        .then(result => {this.savedRecordId = result.Name;}).catch(error => {this.error = error;}); // 5-08-20 changed
                        */ 
                        /* SHOW TOAST OF SUCCESS
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Invoice "'+this.invName+'" was created.', // modified 5-07-20
                                variant: 'success'
                                }),
                            );
                        
                        // NAVIGATE TO INVOICE RECORD PAGE
                        this[NavigationMixin.Navigate]({
                            type: 'standard__recordPage',
                            attributes: {
                            recordId: this.invId,
                            objectApiName: 'Invoice__c',
                            actionName: 'view'
                            }});
                        */
                    //});
                    /* NAVIGATE TO INVOICE RECORD PAGE
                    this[NavigationMixin.Navigate]({
                        type: 'standard__recordPage',
                        attributes: {
                        recordId: this.invId,
                        objectApiName: 'Invoice__c',
                        actionName: 'view'
                        }});
                    */
                }
            })
            .catch(error => {
            this.message = undefined;
            this.error = error;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'We encountered an error creating the record(s).',
                    message: error.body.message,
                    variant: 'error',
                }),
            );
            console.log("error", JSON.stringify(this.error));
            });
        }
    }  
    
    /* CREATE THE INVOICE RECORD
    createRecord(recordInput)
        .then(invoice => {
            this.message = invoice;
            this.error = undefined;  
            if(this.message !== undefined) {
                this.invId = invoice.id;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Invoice created',
                        variant: 'success',
                    }),
                );
                // NAVIGATE TO INVOICE RECORD PAGE
                this[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: this.invId,
                        objectApiName: 'Invoice__c',
                        actionName: 'view'
                    }
                });
            }
            console.log(JSON.stringify(invoice));
            console.log("invoice", this.message);

            // CREATE THE INVOICE LINE RECORDS
            if(this.selectedRecords.length > 0 ){
                createInvLines({ lstConIds : this.selectedRecords, invoiceId : this.invId})
                .then(result => {
                this.message = result;
                this.error = undefined;
                if(this.message !== undefined) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Success',
                            message: 'Invoice Line records created',
                            variant: 'success',
                        }),    
                    ); 
                }
                console.log(JSON.stringify(result));
                console.log("invoice line", this.message);
                })
            }     
        })
        .catch(error => {
            this.message = undefined;
            this.error = error;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'We encountered an error creating the record(s).',
                    message: error.body.message,
                    variant: 'error',
                }),
            );
            console.log("error", JSON.stringify(this.error));
        });
        */
    //}
}







