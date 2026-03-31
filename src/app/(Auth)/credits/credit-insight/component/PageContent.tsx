'use client'

import React from 'react';
import {GradeType} from "@/types/credit/creditInsight";
import CreditMainIndicators from './CreditMainIndicators';
import CreditPeriodDetail from './CreditPeriodDetail';

export default function PageContent({grades, services}: { grades: GradeType[], services: string[] }) {

    return (
        <div className="credit_insight_content">
            <CreditMainIndicators grades={grades}/>
            <CreditPeriodDetail grades={grades} services={services}/>
        </div>
    );
}
