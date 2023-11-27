<template>
    <section class="customer-information">
        <header>Customer information</header>
        <div class="form-group">
            <div class="input-group xs">
                <div class="input-label required">
                    Title
                </div>
                <div class="input">
                    <select>
                        <option>Mr.</option>
                        <option>Ms.</option>
                        <option>Mrs.</option>
                    </select>
                </div>
            </div>
            <div class="input-group">
                <div class="input-label required">
                    First Name
                </div>
                <div class="input">
                    <input type="text" />
                </div>
            </div>
            <div class="input-group xs">
                <div class="input-label">
                    MI
                </div>
                <div class="input">
                    <input
                        class="input-control"
                        type="text"
                        maxlength="1"
                    />
                </div>
            </div>
            <div class="input-group">
                <div class="input-label required">
                    Last Name
                </div>
                <div class="input">
                    <input class="input-control" type="text" />
                </div>
            </div>
        </div>
        <div class="form-group">
            <div class="input-group xs">
                <div class="input-label required">
                    Address
                </div>
                <div class="input">
                    <input
                        class="input-control"
                        type="text"
                        placeholder="Floor and Building, House Number, Street, Barangay, etc."
                    />
                </div>
            </div>
        </div>
        <div class="form-group">
            <div class="input-group">
                <div class="input-label required">
                    State/Province/Region
                </div>
                <div class="input">
                    <input class="input-control" type="text" />
                </div>
            </div>
            <div class="input-group">
                <div class="input-label required">
                    Town/Municipality/City
                </div>
                <div class="input">
                    <input class="input-control" type="text" />
                </div>
            </div>
        </div>
        <div class="form-group">
            <div class="input-group">
                <div class="input-label required">
                    Country
                </div>
                <div class="input">
                    <input class="input-control" type="text" />
                </div>
            </div>
            <div class="input-group">
                <div class="input-label required">
                    Postal Code/Zip Code
                </div>
                <div class="input">
                    <input class="input-control" type="text" />
                </div>
            </div>
        </div>
        <div class="form-group flex-one">
            <div class="input-group">
                <div class="input-label">
                    Vendor ID
                </div>
                <div class="input">
                    <input class="input-control" type="text" />
                </div>
            </div>
            <div class="input-group">
                <div class="input-label required">
                    Gender
                </div>
                <div class="input">
                    <select>
                        <option>Male</option>
                        <option>Female</option>
                        <option>LGBTQA+</option>
                    </select>
                </div>
            </div>
        </div>
        <div class="form-group">
            <div class="input-group">
                <div class="input-label required">
                    Dial Code
                </div>
                <div class="input">
                    <input class="input-control" type="number" />
                </div>
            </div>
            <div class="input-group">
                <div class="input-label required">
                    Phone
                </div>
                <div class="input">
                    <input class="input-control" type="tel" />
                </div>
            </div>
            <div class="input-group">
                <div class="input-label">
                    Alt. Phone
                </div>
                <div class="input">
                    <input class="input-control" type="tel" />
                </div>
            </div>
        </div>
        <div class="form-group">
            <div class="input-group">
                <div class="input-label">
                    Show
                </div>
                <div class="input">
                    <input class="input-control" type="text" />
                </div>
            </div>
            <div class="input-group">
                <div class="input-label required">
                    Email
                </div>
                <div class="input">
                    <input class="input-control" type="email" />
                </div>
            </div>
        </div>
        <div class="form-group">
            <div class="input-group">
                <div class="input-label">
                    Comments
                </div>
                <div class="input">
                    <textarea
                        class="input-control"
                        rows="5"
                        cols="30"
                    ></textarea>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
    export default {
        name: 'CustomerInformation'
    };
</script>

<style scoped>
    .customer-information{
        margin-top: 20px;
    }

    header{
        color:var(--black-secondary);
        font-size: 16px;
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 8px;
    }

    .form-group{
        width: 100%;
        display:flex;
        justify-content: space-between;
        align-content: center;
    }

    .input-group{
        padding: 4px;
        flex-grow: 1;
        min-width: 20%;
    }

    .input-group.xs{
        min-width: 5%;
        width: 5%;
    }

    .form-group.flex-one .input-group{
        flex: 1;
    }

    .input-label{
        font-size: 12px;
        color:var(--black-disabled);
        font-weight: 500;
        margin: 4px 0;
    }

    .input-label.required{
        display: inline-block;
        margin-right: 10px;
        position: relative;
    }

    .input-label.required::after{
        content: "*";
        color: var(--error);
        position: absolute;
        top: 0;
        right: -10px;
    }

    .input-group textarea {
        display: block;
        line-height: 18px;
        height: 100px;
        padding: 16px;
        resize: none;
    }
</style>
