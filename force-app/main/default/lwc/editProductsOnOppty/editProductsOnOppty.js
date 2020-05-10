import { LightningElement, wire, track, api } from 'lwc';
import getOppLines from '@salesforce/apex/LWCDataTableController.getOppLines';
import { updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
//import FIRSTNAME_FIELD from '@salesforce/schema/Contact.FirstName';
//import LASTNAME_FIELD from '@salesforce/schema/Contact.LastName';
//import ID_FIELD from '@salesforce/schema/Contact.Id';
import QUANTITY_FIELD from '@salesforce/schema/OpportunityLine__c.Quantity__c';
import DISCOUNT_FIELD from '@salesforce/schema/OpportunityLine__c.Discount__c';
import LINEDESCRIPTION_FIELD from '@salesforce/schema/OpportunityLine__c.Description__c';
import SALESPRICE_FIELD from '@salesforce/schema/OpportunityLine__c.SalesPrice__c';
import ID_FIELD from '@salesforce/schema/OpportunityLine__c.Id';

const COLS = [
    /* Product's data
    {
        label: 'Product', fieldName: 'ParentId', type: 'lookup', editable: true, required: true,
        typeAttributes: {
            placeholder: 'Select Parent Account',
            uniqueId: { fieldName: 'Id' }, //pass Id of current record to lookup for context
            object: "Product__c",
            icon: "standard:product",
            label: "Product",
            displayFields: "Name",
            displayFormat: "Name",
            filters: ""
        }
    },
    */
    { label: 'Product', fieldName: 'ProductName'},
    { label: 'Product Code', fieldName: 'Code', editable: false },
    { label: 'Product Description', fieldName: 'Description', editable: false }, // needs to be product desc
    { label: 'List Price', fieldName: 'ListPrice', editable: false, type: 'currency', typeAttributes: { currencyCode: 'USD'} },
    // Oppline's data
    { label: 'Quantity', fieldName: 'Quantity', type: 'number', editable: true },
    { label: 'Discount', fieldName: 'Discount', type: 'percent', editable: true },
    { label: 'Line Description', fieldName: 'Description', editable: true },
    { label: 'Sales Price', fieldName: 'SalesPrice', editable: true, type: 'currency', typeAttributes: { currencyCode: 'USD'}}
];
export default class EditProductsOnOppty extends LightningElement {
    @api recordId; //
    @track searchKey = ''; //
    @track refreshTable = [];
    @track oppLines = [];

    @track error;
    @track columns = COLS;
    @track draftValues = [];

    connectedCallback(){
        this.searchKey = this.recordId;
    }

    //@wire(getContactList)
    //contact;
    //@wire(getOppLines, { opptyId: '$searchKey'})
    //oppLines;


    // 5-05-20 Wire Opportunity Line records
    @wire(getOppLines, { opptyId: '$searchKey' }) wired(result) {
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
                //preparedOppLine.nameUrl = `/${oppLine.Product__c}`; // Get the URL of product
                preparedOppLine.Code = oppLine.ProductCode__c;
                preparedOppLine.ListPrice = oppLine.ListPrice__c;
                preparedOppLine.Date = oppLine.ServiceDate__c;
                preparedOppLine.DiscountAmount = oppLine.DiscountAmount__c;
                preparedOppLine.InvoiceTotal = oppLine.LineTotal__c;
                // ----
                preparedOppLine.SalesPrice = oppLine.SalesPrice__c; // oppLine columns
                preparedOppLine.Quantity = oppLine.Quantity__c; // oppLine columns
                preparedOppLine.Description = oppLine.Description__c; // oppLine columns
                preparedOppLine.Discount = oppLine.Discount__c / 100; // oppLine columns
                // ----
                preparedOppLines.push(preparedOppLine);
            });
            this.oppLines = preparedOppLines;
            // setTimeout(() => this.preSelectedRows = this.oppLines.map(record=>record.id));
        }
        if (result.error) {
            this.error = result.error;
        }
    }


    handleSave(event) {

        const fields = {};
        //fields[ID_FIELD.fieldApiName] = event.detail.draftValues[0].Id;
        //fields[FIRSTNAME_FIELD.fieldApiName] = event.detail.draftValues[0].FirstName;
        //fields[LASTNAME_FIELD.fieldApiName] = event.detail.draftValues[0].LastName;
        fields[ID_FIELD.fieldApiName] = event.detail.draftValues[0].id;
        fields[QUANTITY_FIELD.fieldApiName] = event.detail.draftValues[0].Quantity;
        fields[DISCOUNT_FIELD.fieldApiName] = event.detail.draftValues[0].Discount;
        fields[LINEDESCRIPTION_FIELD.fieldApiName] = event.detail.draftValues[0].Description;
        fields[SALESPRICE_FIELD.fieldApiName] = event.detail.draftValues[0].SalesPrice;
        const recordInput = {fields};

        updateRecord(recordInput)
        .then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Products updated',
                    variant: 'success'
                })
            );
            // Clear all draft values
            this.draftValues = [];

            // Display fresh data in the datatable
            return refreshApex(this.refreshTable);
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error creating record',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        });
    }
}