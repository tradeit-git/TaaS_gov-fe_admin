export const regExps = {
    integer : () => /[^0-9]/g,
    //decimal : 소숫점 자리수
    float : (decimal : number ) => {
        decimal = isNaN(decimal) ? decimal : 17;
        return new RegExp(`^\\d*\\.?\\d{0,${decimal}}$`)
    },
    email : () => /^([a-z0-9_.-]+)@([\da-z.-]+)\.([a-z.]{2,6})$/,
    //전화번호 2~3자리-3~4자리-4자리
    contact : () => /^0\d{1,2}-\d{3,4}-\d{4}$/,
    globalContact : () => /^\+[0-9\- ]{6,20}$/,
    //핸드폰번호
    hp: () => /^\d{3}-\d{3,4}-\d{4}$/,
    url : () => /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#()?&\/=]*)/ ,
    twitterUrl : () => /^https?:\/\/(www\.)?twitter\.com\//,
    instagramUrl : () => /^https?:\/\/(www\.)?instagram\.com\//,
    facebookUrl : () => /^https?:\/\/(www\.)?facebook\.com\//,
    linkedinUrl : () => /^https?:\/\/(www\.)?linkedin\.com\//,
    youtubeUrl : () =>  /^https?:\/\/(www\.)?youtube\.com\//,
    businessNumber : () =>/([0-9]{3})-?([0-9]{2})-?([0-9]{5})/,
    loginId : () => /^[a-z](?:[a-z0-9]{4,19})$/,  //소문자로 시작, 소문자 +  숫자 조합 5이상 20 이하
    password : () =>  /^[a-zA-Z\\d`~!@#$%^&*()-_=+]{8,20}$/,
}