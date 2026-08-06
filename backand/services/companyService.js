const Company = require('../models/Company');
const path = require('path');
const fs = require('fs');

class CompanyService {
  static async getActive() {
    return await Company.getOrCreateDefault();
  }

 
  static async findAll() {
    const company = await this.getActive();
    return company ? [company] : [];
  }

  static async findById(id) {
    const company = await Company.findById(id);
    if (!company) {
      const error = new Error('Société non trouvée');
      error.status = 404;
      throw error;
    }
    return company;
  }

 
  static async create(data, user) {
    const existingCount = await Company.countDocuments();
    if (existingCount > 0) {
      const error = new Error('Une seule société est autorisée. Modifiez la société existante.');
      error.status = 400;
      throw error;
    }

    const company = new Company({
      ...data,
      isDefault: true,
      isActive: data.isActive !== false,
      updatedBy: user?._id
    });
    await company.save();
    return company;
  }

  static async update(id, data, user) {
    const company = await Company.findById(id);
    if (!company) {
      const error = new Error('Société non trouvée');
      error.status = 404;
      throw error;
    }

    const allowed = [
      'name', 'designation', 'legalForm',
      'matricule', 'taxId', 'registrationNumber', 'vatNumber',
      'email', 'phone1', 'phone2', 'fax', 'website',
      'address', 'addressComplement', 'city', 'postalCode', 'country',
      'logo', 'logoWidth', 'logoHeight',
      'currency', 'bankName', 'bankIban', 'bankBic', 'bankAccount',
      'defaultPaymentTerms', 'defaultDeliveryTerms', 'defaultWarranty', 'defaultNotes',
      'isActive', 'notes'
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        company[key] = data[key];
      }
    }

   
    company.isDefault = true;
    if (company.isActive === false) {
      company.isActive = true;
    }

    company.updatedBy = user?._id;
    await company.save();

   
    await Company.updateMany(
      { _id: { $ne: company._id } },
      { $set: { isDefault: false, isActive: false } }
    );

    return company;
  }

  static async updateActive(data, user) {
    const company = await Company.getOrCreateDefault();
    return await this.update(company._id, data, user);
  }

  static async setLogo(id, logoPath, dimensions = {}, user) {
    const company = await this.findById(id);
    company.logo = logoPath;
    if (dimensions.logoWidth) company.logoWidth = Number(dimensions.logoWidth);
    if (dimensions.logoHeight) company.logoHeight = Number(dimensions.logoHeight);
    company.updatedBy = user?._id;
    await company.save();
    return company;
  }

  static async setActiveLogo(logoPath, dimensions = {}, user) {
    const company = await Company.getOrCreateDefault();
    return await this.setLogo(company._id, logoPath, dimensions, user);
  }

  static async delete() {
    const error = new Error('Impossible de supprimer la société : une seule société est gérée par l\'application.');
    error.status = 400;
    throw error;
  }

 
  static async getPrintPayload() {
    const company = await Company.getOrCreateDefault();
    return {
      company: company.toPrintCompany(),
      defaultTerms: company.toDefaultTerms(),
      raw: company
    };
  }
}

module.exports = CompanyService;
