-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "sku" VARCHAR(16) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "productCategoryId" INTEGER NOT NULL,
    "productTypeId" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL,
    "Description" VARCHAR(2000) NOT NULL,
    "productStatusId" INTEGER NOT NULL,
    "barCode" VARCHAR(25),
    "createdBy" INTEGER NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL,
    "updatedOn" TIMESTAMP(3),
    "updatedBy" INTEGER NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productCategories" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "description" VARCHAR(10) NOT NULL,

    CONSTRAINT "productCategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productType" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "description" VARCHAR(10) NOT NULL,

    CONSTRAINT "productType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productStatus" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "description" VARCHAR(10) NOT NULL,

    CONSTRAINT "productStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "productCategories_code_key" ON "productCategories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "productCategories_description_key" ON "productCategories"("description");

-- CreateIndex
CREATE UNIQUE INDEX "productType_code_key" ON "productType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "productType_description_key" ON "productType"("description");

-- CreateIndex
CREATE UNIQUE INDEX "productStatus_code_key" ON "productStatus"("code");

-- CreateIndex
CREATE UNIQUE INDEX "productStatus_description_key" ON "productStatus"("description");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_productCategoryId_fkey" FOREIGN KEY ("productCategoryId") REFERENCES "productCategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "productType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_productStatusId_fkey" FOREIGN KEY ("productStatusId") REFERENCES "productStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
